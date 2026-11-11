import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./EmptyState.module.css"
import { ReactNode } from "react"

interface EmptyStateProps {
    icon: IconDefinition
    title?: string
    description?: ReactNode
    bordered?: boolean
    className?: string
}

export default function EmptyState({
    icon,
    title,
    description,
    bordered = false,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`${styles.wrapper} ${bordered ? styles.bordered : ""} ${className}`}>
            <div className={styles.iconCircle}>
                <FontAwesomeIcon icon={icon} className={styles.icon} aria-hidden="true" />
            </div>
            <p className={styles.title}>{title}</p>
            {description && <p className={styles.description}>{description}</p>}
        </div>
    )
}