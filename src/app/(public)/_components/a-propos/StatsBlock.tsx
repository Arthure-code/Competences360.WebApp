import { faBuilding, faAward, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./StatsBlock.module.css"

const STATS = [
    {
        icon: faBuilding,
        value: "150+",
        label: "Organisations accompagnées",
    },
    {
        icon: faAward,
        value: "25",
        label: "Années d'expertise",
    },
    {
        icon: faArrowTrendUp,
        value: "92%",
        label: "Taux de progression des utilisateurs",
    },
]

export default function StatsBlock() {
    return (
        <section className={styles.section}>
            <ul className={styles.list}>
                {STATS.map((stat) => (
                    <li key={stat.label} className={styles.item}>
                        <FontAwesomeIcon icon={stat.icon} className={styles.icon} aria-hidden="true" />
                        <span className={styles.value}>{stat.value}</span>
                        <span className={styles.label}>{stat.label}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}
