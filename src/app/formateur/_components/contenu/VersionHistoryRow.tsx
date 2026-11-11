import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash } from "@fortawesome/free-solid-svg-icons"
import { VERSION_STATUS_LABELS } from "@/constants/moduleVersionStatus"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./VersionHistoryRow.module.css"

interface VersionHistoryRowProps {
    version: ModuleVersion
    versionNumber: number
    changeSummary: string
    isOfficial: boolean
    /** true si CE row peut être supprimé individuellement (brouillon + propriétaire) */
    canDelete: boolean
    /** Réservé au gestionnaire, false côté formateur (voir ModulePageView) */
    canApply: boolean
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu, sinon un gestionnaire atterrissait sur les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
    isSelectMode: boolean
    isSelected: boolean
    onToggleSelect: () => void
    onDeleteSingle: () => void
    onApply: () => void
}

export default function VersionHistoryRow({
    version,
    versionNumber,
    changeSummary,
    isOfficial,
    canDelete,
    canApply,
    role,
    isSelectMode,
    isSelected,
    onToggleSelect,
    onDeleteSingle,
    onApply,
}: VersionHistoryRowProps) {
    return (
        <div className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}>
            {isSelectMode && canDelete && (
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className={styles.checkbox}
                    aria-label={`Sélectionner v${versionNumber}`}
                />
            )}
            {isSelectMode && !canDelete && <span className={styles.checkboxSpacer} />}

            <div className={styles.info}>
                <div className={styles.headerRow}>
                    <span className={styles.versionNumber}>v{versionNumber}</span>
                    <span className={styles.statusBadge}>{VERSION_STATUS_LABELS[version.status]}</span>
                    {isOfficial && <span className={styles.officialBadge}>Version actuelle appliquée</span>}
                </div>
                <p className={styles.changeSummary}>{changeSummary}</p>
                {version.changeNote && <p className={styles.changeNote}>{version.changeNote}</p>}
                <p className={styles.meta}>
                    {formatLongDateLabel(version.createdAt)}, par {version.createdByName}
                </p>
            </div>

            {!isSelectMode && (
                <div className={styles.actions}>
                    <Link href={routes[role].contenu.preview(version.moduleId, version.id)} className={styles.previewLink}>
                        Aperçu
                    </Link>
                    <Link href={routes[role].contenu.edit(version.moduleId, version.id)} className={styles.editLink}>
                        Modifier
                    </Link>
                    {canApply && version.status === "published" && !isOfficial && (
                        <button type="button" onClick={onApply} className={styles.applyLink}>
                            Appliquer
                        </button>
                    )}
                    {canDelete && (
                        <button type="button" onClick={onDeleteSingle} aria-label="Supprimer cette version" className={styles.deleteButton}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}