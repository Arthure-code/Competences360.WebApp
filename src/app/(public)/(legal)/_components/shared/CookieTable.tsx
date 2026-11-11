import styles from "./CookieTable.module.css"

export interface CookieRow {
    name: string
    type: string
    purpose: string
    duration: string
}

interface CookieTableProps {
    rows: CookieRow[]
}

export default function CookieTable({ rows }: CookieTableProps) {
    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Nom</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Finalité</th>
                        <th className={styles.th}>Durée</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.name} className={styles.tr}>
                            <td className={`${styles.td} ${styles.mono}`}>{row.name}</td>
                            <td className={styles.td}>{row.type}</td>
                            <td className={styles.td}>{row.purpose}</td>
                            <td className={styles.td}>{row.duration}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
