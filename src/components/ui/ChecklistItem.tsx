import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./ChecklistItem.module.css"

interface ChecklistItemProps {
    children: React.ReactNode
    className?: string
}

export default function ChecklistItem({ children, className = "" }: ChecklistItemProps) {
    return (
        <div className={`${styles.item} ${className}`}>
            <span className={styles.iconCircle}>
                <FontAwesomeIcon icon={faCheck} className={styles.icon} aria-hidden="true" />
            </span>
            <span className={styles.text}>{children}</span>
        </div>
    )
}
