"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { changeAdminPassword } from "@/_mocksAdmin/adminAuth.actions"
import styles from "./AdminPasswordCard.module.css"

/** Carte indépendante, pas de dépendance aux autres cartes de la page — même principe que les blocs Compte des autres rôles. */
export default function AdminPasswordCard() {
    const router = useRouter()
    const [newPassword, setNewPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    async function handleChangePassword() {
        setError(null)
        setSuccess(false)
        setIsSaving(true)
        const result = await changeAdminPassword(newPassword)
        setIsSaving(false)
        if (!result.success) {
            setError(result.error ?? "Une erreur est survenue.")
            return
        }
        setNewPassword("")
        setSuccess(true)
        router.refresh()
    }

    return (
        <Card padding="lg" className={styles.card}>
            <h2 className={styles.title}>Changer mon mot de passe</h2>
            <label className={styles.field}>
                <span className={styles.fieldLabel}>Nouveau mot de passe</span>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>Mot de passe changé avec succès.</p>}
            <Button
                label={isSaving ? "Changement..." : "Changer le mot de passe"}
                onClick={handleChangePassword}
                disabled={newPassword.length < 4 || isSaving}
            />
        </Card>
    )
}
