"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { changeAdminPassword } from "@/_mocksAdmin/adminAuth.actions"
import styles from "./AdminChangePasswordModal.module.css"

interface AdminChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * Même logique que l'ancien AdminPasswordCard (changeAdminPassword,
 * _mocksAdmin/adminAuth.actions.ts, réel) — juste déplacée dans un modal
 * plutôt qu'une carte toujours ouverte, pour correspondre à la
 * présentation du vrai ChangePasswordModal (components/compte/), jamais
 * vu dans cette session — reconstruit ici de façon autonome plutôt que
 * deviné.
 */
export default function AdminChangePasswordModal({ isOpen, onClose }: AdminChangePasswordModalProps) {
    const router = useRouter()
    const [newPassword, setNewPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function handleChangePassword() {
        setError(null)
        setIsSaving(true)
        const result = await changeAdminPassword(newPassword)
        setIsSaving(false)
        if (!result.success) {
            setError(result.error ?? "Une erreur est survenue.")
            return
        }
        setNewPassword("")
        router.refresh()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Modifier mon mot de passe" maxWidth={400}>
            <h2 className={styles.title}>Modifier mon mot de passe</h2>

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

            <div className={styles.actions}>
                <Button label="Annuler" variant="outline" onClick={onClose} />
                <Button
                    label={isSaving ? "Changement..." : "Changer le mot de passe"}
                    onClick={handleChangePassword}
                    disabled={newPassword.length < 4 || isSaving}
                />
            </div>
        </Modal>
    )
}
