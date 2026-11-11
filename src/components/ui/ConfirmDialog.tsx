"use client"

import Button from "./Button"
import Modal from "./Modal"
import styles from "./ConfirmDialog.module.css"

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Composition de Modal — role="alertdialog" (pas "dialog") : sémantique
 * a11y correcte pour une confirmation qui exige une réponse, distincte
 * d'un modal de contenu général.
 */
export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel = "Annuler",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} role="alertdialog" ariaLabel={title}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
                <Button label={cancelLabel} variant="outline" onClick={onCancel} />
                <Button label={confirmLabel} variant="primary" onClick={onConfirm} />
            </div>
        </Modal>
    )
}