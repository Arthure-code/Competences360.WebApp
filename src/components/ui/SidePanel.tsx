"use client"

import { useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import styles from "./SidePanel.module.css"

interface SidePanelProps {
    isOpen: boolean
    onClose: () => void
    title: string
    /** Ex. "3 non lues" sous le titre */
    subtitle?: string
    /** Ex. "Tout marquer comme lu" — rendu à côté du bouton de fermeture */
    headerAction?: React.ReactNode
    children: React.ReactNode
    /** Largeur en px à partir de 480px — pleine largeur en dessous, toujours */
    width?: number
    className?: string
}

/**
 * Primitif générique : overlay + panneau qui glisse depuis la droite,
 * pleine hauteur, contenu scrollable — pour du contenu long/parcourable
 * (notifications, échéances) contrairement à Modal (centré, contenu
 * court/ponctuel). 
 */
export default function SidePanel({
    isOpen,
    onClose,
    title,
    subtitle,
    headerAction,
    children,
    width = 420,
    className = "",
}: SidePanelProps) {
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
                className={`${styles.panel} ${className}`}
                style={{ "--panel-width": `${width}px` } as React.CSSProperties}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <div className={styles.headerText}>
                        <h2 className={styles.title}>{title}</h2>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>

                    <div className={styles.headerRight}>
                        {headerAction}
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Fermer"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>

                <div className={styles.content}>{children}</div>
            </div>
        </div>
    )
}
