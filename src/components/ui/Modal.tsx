"use client"

import { useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import styles from "./Modal.module.css"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    /** Largeur max en px — défaut 420 (taille confirmation), plus large pour un formulaire */
    maxWidth?: number
    ariaLabel?: string
    /** "alertdialog" pour une confirmation qui exige une réponse (ex. ConfirmDialog), "dialog" pour un contenu général — défaut "dialog" */
    role?: "dialog" | "alertdialog"
    className?: string
}

/**
 * Primitif générique : overlay + boîte centrée + fermeture (Échap, clic du
 * fond, bouton X) — aucune opinion sur le contenu. ConfirmDialog compose
 * ça avec titre/message/actions ; tout autre usage (ex. "+ Rejoindre un
 * groupe") compose ça avec son propre contenu, sans dupliquer ce plomberie.
 * Pas de portail — le z-index --z-modal de variables.css suffit ici.
 */
export default function Modal({
    isOpen,
    onClose,
    children,
    maxWidth = 420,
    ariaLabel,
    role = "dialog",
    className = "",
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.dialog} ${className}`}
                style={{ maxWidth }}
                role={role}
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
                    <FontAwesomeIcon icon={faXmark} />
                </button>
                {children}
            </div>
        </div>
    )
}
