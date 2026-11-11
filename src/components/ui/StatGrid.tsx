import StatCard from "./StatCard"
import styles from "./StatGrid.module.css"

interface StatGridItem {
    id: string
    label: string
    value: string | number
    unit?: string
    icon?: string
}

interface StatGridProps {
    items: StatGridItem[]
    /** Nombre de colonnes fixe (ex. 3 pour Mes réussites) — sinon 2/4 responsive par défaut */
    columns?: number
    className?: string
}

export default function StatGrid({ items, columns, className = "" }: StatGridProps) {
    return (
        <div
            className={`${styles.grid} ${className}`}
            style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
        >
            {items.map((item) => (
                <StatCard key={item.id} label={item.label} value={item.value} unit={item.unit} icon={item.icon} />
            ))}
        </div>
    )
}