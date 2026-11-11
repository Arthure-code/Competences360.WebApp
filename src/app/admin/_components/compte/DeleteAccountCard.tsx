"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { deleteMyAccount } from "@/_mocksAdmin/adminAuth.actions"
import { routes } from "@/constants/routes"
import styles from "./DeleteAccountCard.module.css"

const CONFIRM_PHRASE = "SUPPRIMER"

/**
 * Irréversible — phrase à taper avant de pouvoir confirmer, même patron
 * que Réglages (changement à l'échelle de la plateforme). Les vraies
 * protections (dernier propriétaire, compte racine) sont appliquées côté
 * serveur par deleteMyAccount lui-même — ce composant affiche juste
 * l'erreur si elles se déclenchent.
 */
export default function DeleteAccountCard() {
    const router = useRouter()
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleConfirm() {
        setError(null)
        setIsProcessing(true)
        const result = await deleteMyAccount()
        if (!result.success) {
            setIsProcessing(false)
            setError(result.error ?? "Une erreur est survenue.")
            return
        }
        router.push(routes.admin.login)
        router.refresh()
    }

    return (
        <>
            <Card padding="lg" className={styles.card}>
                <PageSubheader title="Zone de danger" subtitle="Cette action est irréversible." />
                <p className={styles.warningText}>
                    Supprimer votre compte administrateur le retire définitivement de la plateforme. Cette action ne peut
                    pas être annulée.
                </p>
                <Button
                    label="Supprimer mon compte"
                    variant="danger"
                    onClick={() => {
                        setError(null)
                        setConfirmText("")
                        setConfirmOpen(true)
                    }}
                />
            </Card>

            <Modal
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                ariaLabel="Confirmer la suppression de votre compte"
                maxWidth={440}
            >
                <h2 className={styles.modalTitle}>Supprimer votre compte ?</h2>
                <p className={styles.modalText}>
                    Cette action est irréversible — vous perdrez immédiatement l&apos;accès à l&apos;espace Admin.
                </p>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        Tapez <strong>{CONFIRM_PHRASE}</strong> pour confirmer
                    </span>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className={styles.input}
                        autoComplete="off"
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button label="Annuler" variant="outline" onClick={() => setConfirmOpen(false)} />
                    <Button
                        label={isProcessing ? "Suppression..." : "Supprimer définitivement"}
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={confirmText !== CONFIRM_PHRASE || isProcessing}
                    />
                </div>
            </Modal>
        </>
    )
}
