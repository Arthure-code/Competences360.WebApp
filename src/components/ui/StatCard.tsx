import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Card from "@/components/ui/Card"
import { resolveIcon } from "@/lib/iconRegistry"
import styles from "./StatCard.module.css"

interface StatCardProps {
    label: string
    value: string | number
    /** Rendu plus petit, juste après la valeur — ex. "min", "%" */
    unit?: string
    /**
     * Optionnel — quand fourni, bascule la mise en page en "icône en haut,
     * valeur, libellé en dessous" (ex. Mes réussites) au lieu de "libellé en
     * haut, valeur en dessous" (ex. Mon parcours).
     */
    icon?: string
    className?: string
}

export default function StatCard({ label, value, unit, icon, className = "" }: StatCardProps) {
    if (icon) {
        return (
            <Card padding="md" className={`${styles.card} ${className}`}>
                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={resolveIcon(icon)} aria-hidden="true" />
                </div>
                <p className={styles.value}>
                    {value}
                    {unit && <span className={styles.unit}> {unit}</span>}
                </p>
                <p className={styles.labelBelow}>{label}</p>
            </Card>
        )
    }

    return (
        <Card padding="md" className={`${styles.card} ${className}`}>
            <p className={styles.label}>{label}</p>
            <p className={styles.value}>
                {value}
                {unit && <span className={styles.unit}> {unit}</span>}
            </p>
        </Card>
    )
}