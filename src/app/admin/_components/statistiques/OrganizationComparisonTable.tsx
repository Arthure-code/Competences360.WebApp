import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons"
import ProgressBar from "@/components/ui/ProgressBar"
import { routes } from "@/constants/routes"
import type { OrganizationStatsRow } from "@/lib/organizationStats"
import styles from "./OrganizationComparisonTable.module.css"

export type OrganizationSortKey = "name" | "groupCount" | "apprenantCount" | "averageProgress" | "lateCount"
export type SortDirection = "asc" | "desc"

interface OrganizationComparisonTableProps {
    rows: OrganizationStatsRow[]
    sortKey: OrganizationSortKey
    sortDirection: SortDirection
    onSortChange: (key: OrganizationSortKey) => void
}

const COLUMNS: { key: OrganizationSortKey; label: string }[] = [
    { key: "name", label: "Organisation" },
    { key: "groupCount", label: "Groupes" },
    { key: "apprenantCount", label: "Apprenants" },
    { key: "averageProgress", label: "Progression moyenne" },
    { key: "lateCount", label: "En retard" },
]

/**
 * Réutilise le CSS de GroupComparisonTable (import direct du .module.css,
 * mêmes classes) plutôt que de dupliquer tout le style — structurellement
 * identique (rang + colonnes + barre de progression), seul le contenu
 * des colonnes change.
 */
export default function OrganizationComparisonTable({ rows, sortKey, sortDirection, onSortChange }: OrganizationComparisonTableProps) {
    return (
        <div className={styles.table}>
            <div className={styles.header}>
                <span>Rang</span>
                {COLUMNS.map((column) => (
                    <button key={column.key} type="button" className={styles.sortableHeader} onClick={() => onSortChange(column.key)}>
                        {column.label}
                        <FontAwesomeIcon
                            icon={sortKey !== column.key ? faSort : sortDirection === "desc" ? faSortDown : faSortUp}
                            className={sortKey === column.key ? styles.sortIconActive : styles.sortIcon}
                        />
                    </button>
                ))}
            </div>
            {rows.map((row, index) => (
                <Link key={row.organization.id} href={routes.admin.organisations.bySlug(row.organization.id)} className={styles.row}>
                    <span className={styles.rank}>{index + 1}</span>
                    <span className={styles.name}>{row.organization.name}</span>
                    <span className={styles.memberCount}>{row.groupCount}</span>
                    <span className={styles.memberCount}>{row.apprenantCount}</span>
                    <div className={styles.progressCell}>
                        <ProgressBar value={row.averageProgress} ariaLabel={`Progression moyenne, ${row.organization.name}`} />
                        <span className={styles.progressValue}>{row.averageProgress}%</span>
                    </div>
                    <span className={row.lateCount > 0 ? styles.lateCount : styles.noLate}>
                        {row.lateCount > 0 ? row.lateCount : "Aucun"}
                    </span>
                </Link>
            ))}
        </div>
    )
}
