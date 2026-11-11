"use client"

import { useDraggable } from "@dnd-kit/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGripLines } from "@fortawesome/free-solid-svg-icons"
import dndShared from "./dnd/dnd-shared.module.css"
import styles from "./AssociationRenderer.module.css"

interface OptionChipProps {
    id: string
    label: string
    isSelected: boolean
    onTap: () => void
    /**
     * Rendu utilisé à l'intérieur du `DragOverlay` : pas de `useDraggable`
     * actif, juste l'apparence figée qui suit le curseur.
     */
    isOverlay?: boolean
}

/**
 * Une chip de la banque. `useDraggable` ne peut pas être appelé
 * conditionnellement (règle des hooks) — d'où son extraction ici, plutôt
 * que dans la boucle `.map()` de AssociationRenderer.
 *
 * Toute la chip est à la fois cliquable (tap-tap, moyen principal) et
 * draggable — contrairement à OrdreRenderer où seule la poignée déclenche
 * le drag, ici il n'y a pas de bouton flèche à protéger d'un clic
 * accidentel, donc pas besoin de restreindre le drag à la poignée visuelle
 * ⣿ (qui reste purement décorative).
 *
 * L'apparence du drag (origine pointillée, overlay élevé) vient de
 * `dnd/dnd-shared.module.css`, commune à toutes les mécaniques.
 */
export default function OptionChip({ id, label, isSelected, onTap, isOverlay = false }: OptionChipProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled: isOverlay })

    return (
        <button
            ref={isOverlay ? undefined : setNodeRef}
            type="button"
            className={[
                styles.chip,
                isSelected ? styles.chipSelected : "",
                isDragging && !isOverlay ? dndShared.dragOrigin : "",
                isOverlay ? dndShared.dragOverlay : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={onTap}
            aria-pressed={isSelected}
            {...(isOverlay ? {} : { ...attributes, ...listeners })}
        >
            <FontAwesomeIcon icon={faGripLines} className={styles.chipHandle} aria-hidden="true" />
            {label}
        </button>
    )
}