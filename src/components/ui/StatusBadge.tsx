import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./StatusBadge.module.css"

export type StatusVariant = "neutral" | "info" | "warning" | "danger" | "success"

interface StatusBadgeProps {
    variant: StatusVariant
    label: string
    /** Icône optionnelle affichée avant le libellé, ex. triangle d'avertissement pour un retard */
    icon?: IconDefinition
    className?: string
}

export default function StatusBadge({ variant, label, icon, className = "" }: StatusBadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`}>
            {icon && <FontAwesomeIcon icon={icon} className={styles.icon} aria-hidden="true" />}
            {label.toUpperCase()}
        </span>
    )
}