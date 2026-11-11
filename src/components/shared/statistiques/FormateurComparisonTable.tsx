import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons"
import ProgressBar from "@/components/ui/ProgressBar"
import type { FormateurStatsRow } from "@/lib/groupStats"
import styles from "./FormateurComparisonTable.module.css"

export type FormateurSortKey = "formateurName" | "groupCount" | "apprenantCount" | "averageProgress" | "lateCount"
export type SortDirection = "asc" | "desc"

interface FormateurComparisonTableProps {
    rows: FormateurStatsRow[]
    sortKey: FormateurSortKey
    sortDirection: SortDirection
    onSortChange: (key: FormateurSortKey) => void
    /**
     * Lien optionnel par ligne — absent par défaut (comportement inchangé
     * pour le gestionnaire, qui n'a toujours pas de page de détail par
     * formateur, voir le commentaire plus bas). Permet à l'espace Admin
     * de lier vers son propre dossier unifié (/admin/utilisateurs/[id])
     * sans dupliquer tout ce composant. NOTÉ POUR PLUS TARD : le
     * gestionnaire pourrait vouloir le même lien un jour — pas construit
     * maintenant, juste la prop qui le permettra sans retoucher ce
     * fichier une 2e fois.
     */
    getFormateurHref?: (formateurId: string) => string
}

const COLUMNS: { key: FormateurSortKey; label: string }[] = [
    { key: "formateurName", label: "Formateur" },
    { key: "groupCount", label: "Groupes" },
    { key: "apprenantCount", label: "Apprenants" },
    { key: "averageProgress", label: "Progression moyenne" },
    { key: "lateCount", label: "En retard" },
]

/**
 * averageProgress ici est déjà pondéré par apprenant (voir
 * computeFormateurStatsRows, lib/groupStats.ts), pas juste une moyenne
 * de moyennes de groupe.
 */
export default function FormateurComparisonTable({ rows, sortKey, sortDirection, onSortChange, getFormateurHref }: FormateurComparisonTableProps) {
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
            {rows.map((row, index) => {
                const content = (
                    <>
                        <span className={styles.rank}>{index + 1}</span>
                        <span className={styles.name}>{row.formateurName}</span>
                        <span className={styles.groupCount}>{row.groupCount}</span>
                        <span className={styles.apprenantCount}>{row.apprenantCount}</span>
                        <div className={styles.progressCell}>
                            <ProgressBar value={row.averageProgress} ariaLabel={`Progression moyenne, ${row.formateurName}`} />
                            <span className={styles.progressValue}>{row.averageProgress}%</span>
                        </div>
                        <span className={row.lateCount > 0 ? styles.lateCount : styles.noLate}>
                            {row.lateCount > 0 ? row.lateCount : "Aucun"}
                        </span>
                    </>
                )
                return getFormateurHref ? (
                    <Link key={row.formateurId} href={getFormateurHref(row.formateurId)} className={styles.row}>
                        {content}
                    </Link>
                ) : (
                    <div key={row.formateurId} className={styles.row}>
                        {content}
                    </div>
                )
            })}
        </div>
    )
}