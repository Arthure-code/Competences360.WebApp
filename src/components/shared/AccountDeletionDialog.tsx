"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import styles from "./AccountDeletionDialog.module.css"

interface DialogAction {
    label: string
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
    onClick: () => void
}

interface AccountDeletionDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    actions: DialogAction[]
}


export default function AccountDeletionDialog({
    isOpen,
    onClose,
    title,
    message,
    actions,
}: AccountDeletionDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} role="alertdialog" ariaLabel={title} maxWidth={440}>
            <div className={styles.iconWrapper}>
                <FontAwesomeIcon icon={faTriangleExclamation} className={styles.icon} aria-hidden="true" />
            </div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions} data-count={actions.length}>
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        label={action.label}
                        variant={action.variant ?? "outline"}
                        onClick={action.onClick}
                    />
                ))}
            </div>
        </Modal>
    )
}
