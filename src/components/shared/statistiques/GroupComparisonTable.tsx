import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons"
import ProgressBar from "@/components/ui/ProgressBar"
import { routes } from "@/constants/routes"
import type { GroupStatsRow } from "@/lib/groupStats"
import styles from "./GroupComparisonTable.module.css"

export type GroupSortKey = "name" | "memberCount" | "averageProgress" | "lateCount"
export type SortDirection = "asc" | "desc"

interface GroupComparisonTableProps {
    rows: GroupStatsRow[]
    role: "formateur" | "gestionnaire"
    sortKey: GroupSortKey
    sortDirection: SortDirection
    onSortChange: (key: GroupSortKey) => void
    /**
     * Lien optionnel par ligne — absent par défaut (comportement inchangé :
     * routes[role].groupes.bySlug). Permet à l'espace Admin de lier vers
     * /admin/groupes/[slug] sans dupliquer ce composant — même patron que
     * FormateurComparisonTable.getFormateurHref.
     */
    getGroupHref?: (slug: string) => string
}

const COLUMNS: { key: GroupSortKey; label: string }[] = [
    { key: "name", label: "Groupe" },
    { key: "memberCount", label: "Apprenants" },
    { key: "averageProgress", label: "Progression moyenne" },
    { key: "lateCount", label: "En retard" },
]

/**
 * Le rang (position dans rows) reflète toujours le tri actif, peu importe
 * la colonne choisie, pas juste la progression — sinon "Rang" perdrait
 * son sens en triant par un autre critère. Le tri lui-même vit dans le
 * parent (StatistiquesView), cette table ne fait qu'annoncer les clics.
 */
export default function GroupComparisonTable({ rows, role, sortKey, sortDirection, onSortChange, getGroupHref }: GroupComparisonTableProps) {
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
                <Link
                    key={row.group.id}
                    href={getGroupHref ? getGroupHref(row.group.slug) : routes[role].groupes.bySlug(row.group.slug)}
                    className={styles.row}
                >
                    <span className={styles.rank}>{index + 1}</span>
                    <span className={styles.name}>{row.group.name}</span>
                    <span className={styles.memberCount}>{row.memberCount}</span>
                    <div className={styles.progressCell}>
                        <ProgressBar value={row.averageProgress} ariaLabel={`Progression moyenne, ${row.group.name}`} />
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