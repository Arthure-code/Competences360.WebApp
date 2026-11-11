"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCamera } from "@fortawesome/free-solid-svg-icons"
import { formatPhoneNumberIntl } from "react-phone-number-input"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import Avatar from "@/components/ui/Avatar"
import EditableField from "@/components/shared/EditableField"
import ChangePasswordModal from "@/components/compte/ChangePasswordModal"
import ChangeEmailModal from "@/components/compte/ChangeEmailModal"
import ChangePhoneModal from "@/components/compte/ChangePhoneModal"
import { mettreAJourMonProfil } from "@/_mocks/profil.actions"
import { televerserMaPhoto } from "@/_mocks/mediaUpload.actions"
import type { User } from "@/types/user"
import styles from "./PersonalInfoCard.module.css"

interface PersonalInfoCardProps {
    user: User
    /** Numéro au format international, ou null si le compte n'en a pas. */
    telephone: string | null
}

export default function PersonalInfoCard({ user, telephone }: PersonalInfoCardProps) {
    const router = useRouter()
    const [firstName, setFirstName] = useState(user.firstName)
    const [lastName, setLastName] = useState(user.lastName)
    const [preferredFirstName, setPreferredFirstName] = useState(user.preferredFirstName ?? "")
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
    const [erreur, setErreur] = useState<string | null>(null)
    const [motDePasseOuvert, setMotDePasseOuvert] = useState(false)
    const [courrielOuvert, setCourrielOuvert] = useState(false)
    const [telephoneActuel, setTelephoneActuel] = useState(telephone)
    const [telephoneOuvert, setTelephoneOuvert] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    /**
     * Chaque champ enregistre dès sa validation. L'état local n'est mis à jour
     * qu'APRÈS la réponse du serveur : afficher la nouvelle valeur avant
     * confirmation ferait croire à un enregistrement qui n'a pas eu lieu.
     */
    async function enregistrer(champs: {
        firstName?: string
        lastName?: string
        preferredFirstName?: string
    }) {
        setErreur(null)

        const suivant = {
            firstName: champs.firstName ?? firstName,
            lastName: champs.lastName ?? lastName,
            preferredFirstName: champs.preferredFirstName ?? preferredFirstName,
        }

        const resultat = await mettreAJourMonProfil(suivant)

        if (!resultat.succes) {
            setErreur(resultat.erreur ?? "L'enregistrement a échoué.")
            return
        }

        setFirstName(suivant.firstName)
        setLastName(suivant.lastName)
        setPreferredFirstName(suivant.preferredFirstName)
        router.refresh()
    }

    function handleAvatarClick() {
        fileInputRef.current?.click()
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setErreur(null)

        const form = new FormData()
        form.append("file", file)

        const envoi = await televerserMaPhoto(form)

        // L'aperçu local ne remplace la photo affichée qu'une fois le fichier
        // ACCEPTÉ par le serveur. Avant, un fichier refusé (mauvais type, trop
        // gros) s'affichait quand même, et disparaissait au rechargement.
        if (!envoi.succes) {
            setErreur(envoi.erreur ?? "Le téléversement a échoué.")
            event.target.value = ""
            return
        }

        const reader = new FileReader()
        reader.onload = () => setAvatarUrl(reader.result as string)
        reader.readAsDataURL(file)
        event.target.value = ""
        router.refresh()
    }

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader
                title="Informations personnelles"
                subtitle="Ces informations sont visibles dans votre profil."
            />

            <div className={styles.grid}>
                <div className={styles.avatarWrapper}>
                    <button
                        type="button"
                        className={styles.avatarButton}
                        onClick={handleAvatarClick}
                        aria-label="Changer la photo de profil"
                    >
                        <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size={96} />
                        <span className={styles.avatarOverlay}>
                            <FontAwesomeIcon icon={faCamera} />
                        </span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                </div>

                <div className={styles.fields}>
                    {erreur && (
                        <p className={styles.passwordLabel} role="alert">
                            {erreur}
                        </p>
                    )}
                    <div className={styles.row}>
                        <EditableField
                            label="Prénom"
                            value={firstName}
                            onSave={(valeur) => enregistrer({ firstName: valeur })}
                            className={styles.fieldItem}
                        />
                        <EditableField
                            label="Nom"
                            value={lastName}
                            onSave={(valeur) => enregistrer({ lastName: valeur })}
                            className={styles.fieldItem}
                        />
                    </div>
                    <div className={styles.row}>
                        <EditableField
                            label="Prénom préféré"
                            hint="(facultatif, affiché dans l'application)"
                            value={preferredFirstName}
                            onSave={(valeur) => enregistrer({ preferredFirstName: valeur })}
                            className={styles.fieldItem}
                        />

                        <div className={styles.fieldItem}>
                            <span className={styles.passwordLabel}>Adresse courriel</span>
                            <div className={styles.passwordRow}>
                                <span>{user.email || "—"}</span>
                                <button
                                    type="button"
                                    className={styles.passwordLink}
                                    onClick={() => setCourrielOuvert(true)}
                                >
                                    Modifier mon adresse →
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.passwordField}>
                        <span className={styles.passwordLabel}>Téléphone</span>
                        <div className={styles.passwordRow}>
                            <span>{telephoneActuel ? formatPhoneNumberIntl(telephoneActuel) || telephoneActuel : "—"}</span>
                            <button
                                type="button"
                                className={styles.passwordLink}
                                onClick={() => setTelephoneOuvert(true)}
                            >
                                {telephoneActuel ? "Modifier mon numéro →" : "Ajouter un numéro →"}
                            </button>
                        </div>
                    </div>

                    <div className={styles.passwordField}>
                        <span className={styles.passwordLabel}>Mot de passe</span>
                        <div className={styles.passwordRow}>
                            <span className={styles.passwordDots}>••••••••</span>
                            {/*
                              C'était un `href="#"` : un lien d'apparence
                              normale qui ne menait nulle part, alors que
                              PUT /api/users/password existait déjà.
                            */}
                            <button
                                type="button"
                                className={styles.passwordLink}
                                onClick={() => setMotDePasseOuvert(true)}
                            >
                                Modifier mon mot de passe →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={motDePasseOuvert}
                onClose={() => setMotDePasseOuvert(false)}
            />

            <ChangeEmailModal
                isOpen={courrielOuvert}
                onClose={() => setCourrielOuvert(false)}
            />

            <ChangePhoneModal
                isOpen={telephoneOuvert}
                onClose={() => setTelephoneOuvert(false)}
                onChange={setTelephoneActuel}
            />
        </Card>
    )
}