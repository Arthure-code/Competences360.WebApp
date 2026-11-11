import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons"
import ProgressBar from "@/components/ui/ProgressBar"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import styles from "./ApprenantComparisonTable.module.css"

export type ApprenantSortKey = "name" | "groupName" | "progressPercent" | "scoreTrend" | "lateCount" | "lastActiveAt"
export type SortDirection = "asc" | "desc"

interface ApprenantComparisonTableProps {
    summaries: ApprenantSummary[]
    /** Absent côté gestionnaire, pas encore de page de détail par apprenant sous /gestionnaire */
    role?: "formateur" | "gestionnaire"
    sortKey: ApprenantSortKey
    sortDirection: SortDirection
    onSortChange: (key: ApprenantSortKey) => void
    /**
     * Lien optionnel par ligne — permet à l'espace Admin de lier vers son
     * propre dossier unifié (/admin/utilisateurs/[userId]) sans dupliquer
     * ce composant. Prioritaire sur role s'il est fourni.
     */
    getApprenantHref?: (userId: string) => string
}

const COLUMNS: { key: ApprenantSortKey; label: string }[] = [
    { key: "name", label: "Apprenant" },
    { key: "groupName", label: "Groupe" },
    { key: "progressPercent", label: "Progression" },
    { key: "scoreTrend", label: "Tendance" },
    { key: "lateCount", label: "En retard" },
    { key: "lastActiveAt", label: "Dernière activité" },
]

/**
 * Le tri lui-même vit dans le parent (StatistiquesView), cette table
 * annonce seulement les clics, même principe que GroupComparisonTable.
 */
export default function ApprenantComparisonTable({
    summaries,
    role,
    sortKey,
    sortDirection,
    onSortChange,
    getApprenantHref,
}: ApprenantComparisonTableProps) {
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
            {summaries.map((summary, index) => {
                const content = (
                    <>
                        <span className={styles.rank}>{index + 1}</span>
                        <span className={styles.name}>{summary.fullName}</span>
                        <span className={styles.groupName}>{summary.groupName}</span>
                        <div className={styles.progressCell}>
                            <ProgressBar value={summary.progressPercent} ariaLabel={`Progression, ${summary.fullName}`} />
                            <span className={styles.progressValue}>{summary.progressPercent}%</span>
                        </div>
                        <span
                            className={
                                summary.scoreTrend === null
                                    ? styles.trendNeutral
                                    : summary.scoreTrend >= 0
                                      ? styles.trendUp
                                      : styles.trendDown
                            }
                        >
                            {summary.scoreTrend === null ? "Pas assez de données" : `${summary.scoreTrend > 0 ? "+" : ""}${summary.scoreTrend}`}
                        </span>
                        <span className={summary.lateModuleTitles.length > 0 ? styles.lateCount : styles.noLate}>
                            {summary.lateModuleTitles.length > 0 ? summary.lateModuleTitles.length : "Aucun"}
                        </span>
                        <span className={styles.lastActive}>{formatLongDateLabel(summary.lastActiveAt)}</span>
                    </>
                )
                const href = getApprenantHref
                    ? getApprenantHref(summary.userId)
                    : role === "formateur"
                      ? routes.formateur.apprenants.bySlug(summary.userId)
                      : null

                return href ? (
                    <Link key={`${summary.userId}-${summary.groupId}`} href={href} className={styles.row}>
                        {content}
                    </Link>
                ) : (
                    <div key={`${summary.userId}-${summary.groupId}`} className={styles.rowStatic}>
                        {content}
                    </div>
                )
            })}
        </div>
    )
}