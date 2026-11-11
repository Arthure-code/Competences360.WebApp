"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import {
    faXmark,
    faCircleExclamation,
    faTriangleExclamation,
    faCircleCheck,
    faCircleInfo,
} from "@fortawesome/free-solid-svg-icons"
import { resolveIcon } from "@/lib/iconRegistry"
import Button from "@/components/ui/Button"
import type { Notice as NoticeType, NoticeVariant } from "@/types/notice"
import styles from "./Notice.module.css"

const DEFAULT_ICON: Record<NoticeVariant, IconDefinition> = {
    error: faCircleExclamation,
    warning: faTriangleExclamation,
    success: faCircleCheck,
    info: faCircleInfo,
}

interface NoticeProps {
    notice: NoticeType
    /**
     * "sm" — notice compacte en ligne, sans titre/action/dismiss (ex. erreur
     * de formulaire, ancien usage de InlineNotice).
     * "md" — style toast : icône + titre + message sur une ligne, action
     * (si présente) sur sa propre ligne en dessous, dismiss à droite.
     */
    size?: "sm" | "md"
    onDismiss?: () => void
    className?: string
}

export default function Notice({ notice, size = "md", onDismiss, className = "" }: NoticeProps) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null

    const { variant, icon, title, message, actionHref, actionLabel, dismissible } = notice
    const resolvedIcon = icon ? resolveIcon(icon) : DEFAULT_ICON[variant]

    function handleDismiss() {
        setDismissed(true)
        onDismiss?.()
    }

    if (size === "sm") {
        return (
            <div
                className={`${styles.notice} ${styles[variant]} ${styles.sm} ${className}`}
                role="alert"
            >
                <FontAwesomeIcon icon={resolvedIcon} className={styles.iconInline} aria-hidden="true" />
                <p className={styles.messageInline}>{message}</p>
            </div>
        )
    }

    return (
        <div className={`${styles.notice} ${styles[variant]} ${styles.md} ${className}`} role="status">
            <div className={styles.iconCircle}>
                <FontAwesomeIcon icon={resolvedIcon} aria-hidden="true" />
            </div>

            <div className={styles.text}>
                <div className={styles.msgContent}>
                    {title && <h3 className={styles.title}>{title}</h3>}
                    <p className={styles.message}>{message}</p>
                </div>

                {actionLabel && actionHref && (
                    <Button
                        label={actionLabel}
                        href={actionHref}
                        variant="secondary"
                        size="sm"
                        className={styles.actionButton}
                    />
                )}
            </div>

            {dismissible && (
                <button
                    type="button"
                    className={styles.dismissButton}
                    onClick={handleDismiss}
                    aria-label="Fermer"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            )}
        </div>
    )
}