import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash, faChevronUp, faChevronDown, faSliders, faLink } from "@fortawesome/free-solid-svg-icons"
import CommentBadge from "./review/CommentBadge"
import type { NiveauDraft } from "@/types/moduleVersion"
import styles from "./NiveauSidebar.module.css"

interface NiveauSidebarProps {
    niveaux: NiveauDraft[]
    selectedId: string
    onSelect: (id: string) => void
    onAdd: () => void
    onRemove: (id: string) => void
    onMove: (id: string, direction: -1 | 1) => void
    /** Total + non résolus par activité, agrège ses propres commentaires ET ceux de tous ses exercices, pour repérer d'un coup d'œil quelle activité a encore des choses à traiter sans devoir l'ouvrir */
    commentCounts?: Record<string, { total: number; unresolved: number }>
    /**
     * Cache ajouter/retirer/réordonner, mais jamais la sélection : parcourir
     * les activités doit rester possible en aperçu (voir ContentEditor.tsx),
     * seule l'édition doit être bloquée.
     */
    readOnly?: boolean
    /** Nombre de liens externes, affiché à côté de l'item — même esprit que PageSubheader(..., count) ailleurs, pour voir d'un coup d'œil s'il y en a déjà */
    externalLinksCount?: number
}

/** Réordre par boutons monter/descendre plutôt que glisser-déposer, même résultat, sans dépendance de librairie à choisir unilatéralement. */
export default function NiveauSidebar({
    niveaux,
    selectedId,
    onSelect,
    onAdd,
    onRemove,
    onMove,
    commentCounts = {},
    readOnly = false,
    externalLinksCount = 0,
}: NiveauSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <button
                type="button"
                className={`${styles.item} ${selectedId === "module-info" ? styles.itemActive : ""}`}
                onClick={() => onSelect("module-info")}
            >
                <FontAwesomeIcon icon={faSliders} aria-hidden="true" />
                Infos du module
            </button>

            <button
                type="button"
                className={`${styles.item} ${selectedId === "external-links" ? styles.itemActive : ""}`}
                onClick={() => onSelect("external-links")}
            >
                <FontAwesomeIcon icon={faLink} aria-hidden="true" />
                Liens externes{externalLinksCount > 0 ? ` (${externalLinksCount})` : ""}
            </button>

            <div className={styles.divider} />

            <div className={styles.niveauList}>
                {niveaux.map((niveau, index) => (
                    <div
                        key={niveau.id}
                        className={`${styles.niveauRow} ${selectedId === niveau.id ? styles.itemActive : ""}`}
                    >
                        <button type="button" className={styles.niveauButton} onClick={() => onSelect(niveau.id)}>
                            <span className={styles.niveauIndex}>{index + 1}</span>
                            <span className={styles.niveauTitle}>{niveau.title || "Activité sans titre"}</span>
                            <CommentBadge
                                total={commentCounts[niveau.id]?.total ?? 0}
                                unresolved={commentCounts[niveau.id]?.unresolved ?? 0}
                            />
                        </button>
                        {!readOnly && (
                            <div className={styles.niveauActions}>
                                <button
                                    type="button"
                                    onClick={() => onMove(niveau.id, -1)}
                                    disabled={index === 0}
                                    aria-label="Monter"
                                >
                                    <FontAwesomeIcon icon={faChevronUp} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMove(niveau.id, 1)}
                                    disabled={index === niveaux.length - 1}
                                    aria-label="Descendre"
                                >
                                    <FontAwesomeIcon icon={faChevronDown} />
                                </button>
                                <button type="button" onClick={() => onRemove(niveau.id)} aria-label="Retirer cette activité">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!readOnly && (
                <button type="button" className={styles.addButton} onClick={onAdd}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                    Ajouter une activité
                </button>
            )}
        </aside>
    )
}