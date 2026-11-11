import { faTriangleExclamation, faCircleInfo, faCheck } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./LegalCallout.module.css"

type CalloutVariant = "warning" | "info" | "emphasis"

interface LegalCalloutProps {
    variant?: CalloutVariant
    children: React.ReactNode
}

const ICONS = {
    warning: faTriangleExclamation,
    info: faCircleInfo,
    emphasis: faCheck,
}

export default function LegalCallout({ variant = "warning", children }: LegalCalloutProps) {
    return (
        <div className={`${styles.callout} ${styles[variant]}`} role="note">
            <FontAwesomeIcon icon={ICONS[variant]} className={styles.icon} aria-hidden="true" />
            <p className={styles.text}>{children}</p>
        </div>
    )
}