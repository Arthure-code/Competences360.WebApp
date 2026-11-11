import styles from "./PillBadge.module.css"

interface PillBadgeProps {
    label: string
    href?: string
}

export default function PillBadge({ label, href }: PillBadgeProps) {
    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.pill}>
                {label}
            </a>
        )
    }

    return <span className={styles.pill}>{label}</span>
}
