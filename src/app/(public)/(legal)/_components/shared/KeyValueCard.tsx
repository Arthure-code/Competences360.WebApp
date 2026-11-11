import styles from "./KeyValueCard.module.css"

export interface KeyValueRow {
    label: string
    value: React.ReactNode
    placeholder?: boolean
}

interface KeyValueCardProps {
    title: string
    rows: KeyValueRow[]
}

export default function KeyValueCard({ title, rows }: KeyValueCardProps) {
    return (
        <div className={styles.card}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.rows}>
                {rows.map((row) => (
                    <div key={row.label} className={styles.row}>
                        <span className={styles.label}>{row.label}</span>
                        <span className={row.placeholder ? styles.valuePlaceholder : styles.value}>
                            {row.placeholder ? `[${row.value}]` : row.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
