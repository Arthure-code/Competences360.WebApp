"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import EditableField from "@/components/shared/EditableField"
import AdminChangePasswordModal from "./AdminChangePasswordModal"
import { updateMyProfile } from "@/_mocksAdmin/adminAuth.actions"
import type { AdminUser } from "@/types/adminUser"
import styles from "./AdminPersonalInfoCard.module.css"

interface AdminPersonalInfoCardProps {
    admin: AdminUser
}

/**
 * AdminUser a maintenant de vrais champs séparés (firstName/lastName/
 * preferredFirstName, voir types/adminUser.ts) — plus de split(" ")
 * fragile ici (un nom composé comme "Marie Claire Dubois" se découpait
 * mal). Lus et modifiés directement.
 *
 * Mot de passe DANS cette carte (points + lien, ouvre
 * AdminChangePasswordModal) — même présentation que le vrai
 * PersonalInfoCard, plutôt qu'une carte séparée toujours ouverte.
 */
export default function AdminPersonalInfoCard({ admin }: AdminPersonalInfoCardProps) {
    const router = useRouter()
    const [firstName, setFirstName] = useState(admin.firstName)
    const [lastName, setLastName] = useState(admin.lastName)
    const [preferredFirstName, setPreferredFirstName] = useState(admin.preferredFirstName ?? "")
    const [email, setEmail] = useState(admin.email)
    const [erreur, setErreur] = useState<string | null>(null)
    const [motDePasseOuvert, setMotDePasseOuvert] = useState(false)

    async function enregistrer(champs: { firstName?: string; lastName?: string; preferredFirstName?: string; email?: string }) {
        setErreur(null)

        const suivant = {
            firstName: champs.firstName ?? firstName,
            lastName: champs.lastName ?? lastName,
            preferredFirstName: champs.preferredFirstName ?? preferredFirstName,
            email: champs.email ?? email,
        }

        const resultat = await updateMyProfile(suivant)

        if (!resultat.success) {
            setErreur(resultat.error ?? "L'enregistrement a échoué.")
            return
        }

        setFirstName(suivant.firstName)
        setLastName(suivant.lastName)
        setPreferredFirstName(suivant.preferredFirstName)
        setEmail(suivant.email)
        router.refresh()
    }

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader title="Informations personnelles" subtitle="Ces informations sont visibles dans l'espace Admin." />

            <div className={styles.fields}>
                {erreur && (
                    <p className={styles.error} role="alert">
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
                    <EditableField
                        label="Courriel"
                        value={email}
                        onSave={(valeur) => enregistrer({ email: valeur })}
                        className={styles.fieldItem}
                    />
                </div>

                <div className={styles.passwordField}>
                    <span className={styles.passwordLabel}>Mot de passe</span>
                    <div className={styles.passwordRow}>
                        <span className={styles.passwordDots}>••••••••</span>
                        <button type="button" className={styles.passwordLink} onClick={() => setMotDePasseOuvert(true)}>
                            Modifier mon mot de passe →
                        </button>
                    </div>
                </div>
            </div>

            <AdminChangePasswordModal isOpen={motDePasseOuvert} onClose={() => setMotDePasseOuvert(false)} />
        </Card>
    )
}