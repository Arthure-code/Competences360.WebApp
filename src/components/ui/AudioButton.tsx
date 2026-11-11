"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons"
import { lireAVoixHaute } from "@/_mocks/syntheseVocale.actions"
import styles from "./AudioButton.module.css"

interface AudioButtonProps {
    // Texte lu à voix haute au clic.
    text?: string
    // Zone dont le texte affiché est lu quand `text` n'est pas fourni. Lire ce
    // qui est à l'écran plutôt qu'une chaîne reconstruite évite au point
    // d'appel de connaître la forme de la donnée : une section vide n'a rien à
    // lire, une section enrichie est lue sans que ce composant change.
    cible?: RefObject<HTMLElement | null>
    label?: string
    className?: string
}

// Bouton haut-parleur, présent partout où une lecture audio est prévue.
//
// La voix vient du serveur, qui synthétise puis garde le fichier : le premier
// clic sur un texte donné attend quelques secondes, les suivants sont immédiats.
// Le serveur ne connaît rien du contenu, il reçoit du texte — n'importe quel
// texte de l'application peut donc être lu sans rien changer ici.
export default function AudioButton({
    text,
    cible,
    label = "Écouter",
    className = "",
}: AudioButtonProps) {
    const [enAttente, setEnAttente] = useState(false)
    const lecteur = useRef<HTMLAudioElement | null>(null)

    // Sans `cible`, l'absence de texte est connue dès le rendu : le bouton se
    // désactive plutôt que de rester cliquable sans effet.
    const rienALire = !text?.trim() && !cible

    // Sans cet arrêt, quitter la page pendant une lecture la laisse se
    // poursuivre : le composant disparaît, la voix reste.
    useEffect(() => {
        return () => {
            lecteur.current?.pause()
            lecteur.current = null
        }
    }, [])

    async function handleClick() {
        // Un second clic interrompt la lecture en cours plutôt que de
        // superposer deux voix.
        if (lecteur.current) {
            lecteur.current.pause()
            lecteur.current = null
            return
        }

        // `innerText` et non `textContent` : il rend ce qui est visible, sans
        // les éléments masqués, et coupe les lignes là où l'œil les coupe.
        const aLire = text?.trim() || cible?.current?.innerText?.trim() || ""

        if (!aLire || enAttente) {
            return
        }

        setEnAttente(true)
        const url = await lireAVoixHaute(aLire)
        setEnAttente(false)

        if (!url) {
            return
        }

        const audio = new Audio(url)
        audio.addEventListener("ended", () => {
            lecteur.current = null
        })

        lecteur.current = audio

        audio.play().catch(() => {
            lecteur.current = null
        })
    }

    return (
        <button
            type="button"
            className={[styles.button, className].filter(Boolean).join(" ")}
            onClick={handleClick}
            disabled={enAttente || rienALire}
            aria-busy={enAttente}
            aria-label={label}
        >
            <FontAwesomeIcon icon={faVolumeHigh} />
        </button>
    )
}