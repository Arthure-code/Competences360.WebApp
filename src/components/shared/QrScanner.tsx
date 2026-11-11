"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { getJoinQrCodeForCode } from "@/_mocks/groups.mock"
import styles from "./QrScanner.module.css"

/** Côté le plus long de l'image analysée. Au-delà, le décodage coûte sans rien apporter. */
const COTE_MAXIMAL = 900

/** Environ dix analyses par seconde : au rythme de l'écran, un téléphone sature. */
const INTERVALLE_ANALYSE_MS = 100

/**
 * Les QR de l'application sont noirs sur blanc, mais un code affiché en
 * couleurs inversées reste un QR valide. Une image sur deux est analysée dans
 * chaque polarité : les deux sont couvertes sans doubler le coût par image,
 * ce que ferait « attemptBoth ».
 */
const POLARITES = ["dontInvert", "onlyInvert"] as const

/** Quatre caractères, un tiret, quatre caractères : le format de JoinCodeGenerator. */
const CODE_COMPLET = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/

const CAMERA_INDISPONIBLE =
    "La caméra n'est pas accessible depuis cette adresse. Entrez le code dans l'onglet voisin."

const CAMERA_ABSENTE =
    "Aucune caméra n'a été détectée sur cet appareil. Entrez le code dans l'onglet voisin."

const CAMERA_OCCUPEE =
    "La caméra est utilisée par une autre application. Fermez-la, ou entrez le code dans l'onglet voisin."

const CAMERA_REFUSEE =
    "L'accès à la caméra a été refusé. Autorisez-le, ou entrez le code dans l'onglet voisin."

/** Les quatre issues que getUserMedia distingue, et qui appellent des gestes différents. */
function messagePour(erreur: unknown): string {
    const nom = erreur instanceof DOMException ? erreur.name : ""

    switch (nom) {
        // Aucun périphérique, ou aucun qui satisfasse la caméra arrière
        // demandée : il n'y a rien à autoriser.
        case "NotFoundError":
        case "OverconstrainedError":
            return CAMERA_ABSENTE

        // Caméra présente mais tenue par un autre logiciel — le cas le plus
        // fréquent sous Windows.
        case "NotReadableError":
            return CAMERA_OCCUPEE

        default:
            return CAMERA_REFUSEE
    }
}

interface QrScannerProps {
    /** Appelé au premier code reconnu. Le composant ne décide pas de la suite. */
    onScan: (code: string) => void
    /**
     * Code d'adhésion saisi dans l'onglet voisin. Renseigné, son QR remplace
     * l'illustration : c'est celui du groupe, réel et scannable.
     */
    code?: string
}

/**
 * Le QR d'un groupe encode un lien vers l'écran d'adhésion, pas le code brut
 * (voir GroupJoinCodeBadge). On en extrait le paramètre `code` ; un QR qui
 * porterait le code seul reste lisible tel quel.
 */
function extraireCode(texte: string): string {
    try {
        return new URL(texte).searchParams.get("code") ?? texte
    } catch {
        return texte
    }
}

export default function QrScanner({ onScan, code }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [erreur, setErreur] = useState<string | null>(null)
    const [qrDuGroupe, setQrDuGroupe] = useState<string | null>(null)
    const [qrDeLaPage, setQrDeLaPage] = useState<string | null>(null)

    // L'API refuse un code mal formé : inutile de l'appeler à chaque frappe.
    const codeComplet = code && CODE_COMPLET.test(code) ? code : null

    // La caméra a échoué : à la place du viseur, le QR de la page d'adhésion.
    // Scanné au téléphone, il ouvre ce même écran là où la caméra marche.
    useEffect(() => {
        if (erreur === null) return

        let annule = false

        void getJoinQrCodeForCode().then((url) => {
            if (!annule) setQrDeLaPage(url ?? null)
        })

        return () => {
            annule = true
        }
    }, [erreur])

    useEffect(() => {
        if (codeComplet === null) {
            setQrDuGroupe(null)
            return
        }

        let annule = false

        void getJoinQrCodeForCode(codeComplet).then((url) => {
            // Une réponse arrivée après une nouvelle saisie est périmée.
            if (!annule) setQrDuGroupe(url ?? null)
        })

        return () => {
            annule = true
        }
    }, [codeComplet])

    useEffect(() => {
        let flux: MediaStream | null = null
        let image: number | undefined
        let attente: number | undefined
        let arrete = false
        let polarite = 0

        /** Reprogramme une analyse, sauf si la caméra a déjà été coupée. */
        function reprogrammer() {
            if (arrete) return

            attente = window.setTimeout(() => {
                attente = undefined
                image = requestAnimationFrame(lire)
            }, INTERVALLE_ANALYSE_MS)
        }

        function lire() {
            image = undefined

            const video = videoRef.current
            const canvas = canvasRef.current

            // HAVE_CURRENT_DATA suffit : exiger HAVE_ENOUGH_DATA laisse des
            // appareils lents sans jamais démarrer.
            if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                reprogrammer()
                return
            }

            // L'image est réduite avant analyse : décoder du 1920x1080 coûte
            // plusieurs fois plus cher sans améliorer la lecture.
            const facteur = Math.min(
                1,
                COTE_MAXIMAL / Math.max(video.videoWidth, video.videoHeight),
            )

            canvas.width = Math.round(video.videoWidth * facteur)
            canvas.height = Math.round(video.videoHeight * facteur)

            const contexte = canvas.getContext("2d", { willReadFrequently: true })

            if (!contexte || canvas.width === 0 || canvas.height === 0) {
                reprogrammer()
                return
            }

            contexte.drawImage(video, 0, 0, canvas.width, canvas.height)

            const pixels = contexte.getImageData(0, 0, canvas.width, canvas.height)

            const resultat = jsQR(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: POLARITES[polarite],
            })

            polarite = (polarite + 1) % POLARITES.length

            if (!resultat?.data) {
                reprogrammer()
                return
            }

            // Un seul déclenchement : la caméra est coupée avant de remonter la
            // valeur, sinon la boucle relit le même code à chaque image.
            arreter()
            onScan(extraireCode(resultat.data))
        }

        function arreter() {
            if (image !== undefined) {
                cancelAnimationFrame(image)
                image = undefined
            }

            if (attente !== undefined) {
                window.clearTimeout(attente)
                attente = undefined
            }

            flux?.getTracks().forEach((piste) => piste.stop())
            flux = null
        }

        async function demarrer() {
            // Le QR du groupe occupe la boîte : allumer la caméra pour un viseur
            // qui n'est pas rendu ferait clignoter le voyant pour rien.
            if (qrDuGroupe) return

            // getUserMedia n'existe qu'en contexte sécurisé : HTTPS, ou
            // localhost. Sur une adresse LAN en HTTP, le navigateur ne l'expose
            // pas du tout.
            if (!navigator.mediaDevices?.getUserMedia) {
                setErreur(CAMERA_INDISPONIBLE)
                return
            }

            try {
                flux = await navigator.mediaDevices.getUserMedia({
                    // « ideal » et non « exact » : un poste sans caméra arrière
                    // reçoit la frontale au lieu d'un refus.
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                })
            } catch (erreurCamera) {
                setErreur(messagePour(erreurCamera))
                return
            }

            if (arrete) {
                arreter()
                return
            }

            const video = videoRef.current

            if (!video) {
                arreter()
                return
            }

            video.srcObject = flux

            try {
                await video.play()
            } catch {
                // iOS refuse la lecture hors geste utilisateur : la balise porte
                // autoPlay, l'image arrive quand même. On n'abandonne pas.
            }

            image = requestAnimationFrame(lire)
        }

        void demarrer()

        // La caméra est relâchée au démontage : changer d'onglet ou fermer la
        // fenêtre doit éteindre le voyant.
        return () => {
            arrete = true
            arreter()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qrDuGroupe])

    return (
        <div className={styles.wrapper}>
            <div className={styles.viewfinder}>
                {qrDuGroupe ? (
                    <img
                        src={qrDuGroupe}
                        alt={`Code QR du groupe ${code}`}
                        className={styles.qrDuGroupe}
                    />
                ) : erreur && qrDeLaPage ? (
                    <img
                        src={qrDeLaPage}
                        alt="Code QR de la page d'adhésion"
                        className={styles.qrDuGroupe}
                    />
                ) : erreur ? (
                    <>
                        {/* Dernier repli, l'API n'a pas répondu : illustration
                            seule, elle n'encode aucun groupe. */}
                        <img
                            src="/img/qr-illustration.svg"
                            alt=""
                            className={styles.illustration}
                        />
                        <span className={styles.label}>Caméra indisponible</span>
                    </>
                ) : (
                    <video
                        ref={videoRef}
                        className={styles.video}
                        muted
                        autoPlay
                        playsInline
                        aria-label="Viseur de la caméra"
                    />
                )}
            </div>

            <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

            <p className={styles.hint} role={erreur && !qrDuGroupe && !qrDeLaPage ? "alert" : undefined}>
                {qrDuGroupe
                    ? "Faites scanner ce code pour rejoindre le même groupe"
                    : erreur && qrDeLaPage
                        ? "Scannez ce code avec votre téléphone pour continuer avec sa caméra"
                        : (erreur ?? "Pointez votre caméra vers le QR code de votre groupe")}
            </p>
        </div>
    )
}