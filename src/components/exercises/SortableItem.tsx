"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronUp, faChevronDown, faGripLines } from "@fortawesome/free-solid-svg-icons"
import ResultIcon from "./dnd/ResultIcon"
import dndShared from "./dnd/dnd-shared.module.css"
import type { ItemState } from "./OrdreRenderer"
import styles from "./OrdreRenderer.module.css"

interface SortableItemProps {
    id: string
    index: number
    label: string
    state: ItemState
    isAnswered: boolean
    isLast: boolean
    onMoveUp: () => void
    onMoveDown: () => void
    /**
     * Rendu utilisé à l'intérieur du `DragOverlay` : pas de `useSortable`
     * actif (pas de ref, pas de transform de la liste), juste l'apparence
     * figée qui suit le curseur.
     */
    isOverlay?: boolean
}

/**
 * Un item réordonnable. `useSortable` ne peut pas être appelé
 * conditionnellement (règle des hooks) — d'où son extraction dans un
 * composant dédié, plutôt que dans la boucle `.map()` de OrdreRenderer.
 *
 * Le drag ne se déclenche que depuis la poignée : seuls `.dragHandle` porte
 * les `listeners` de dnd-kit. Le reste de la ligne (boutons flèche, texte)
 * reste utilisable normalement, sans risque de déclencher un drag
 * accidentel au clic.
 *
 * L'apparence du drag (origine pointillée, overlay élevé) vient de
 * `dnd/dnd-shared.module.css`, commune à toutes les mécaniques — seules
 * les couleurs par état (correct/incorrect) restent locales à Ordre.
 */
export default function SortableItem({
    id,
    index,
    label,
    state,
    isAnswered,
    isLast,
    onMoveUp,
    onMoveDown,
    isOverlay = false,
}: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: isAnswered || isOverlay,
    })

    const style = isOverlay
        ? undefined
        : {
              transform: CSS.Transform.toString(transform),
              transition,
          }

    return (
        <li
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className={[
                styles.item,
                styles[state],
                isDragging && !isOverlay ? dndShared.dragOrigin : "",
                isOverlay ? dndShared.dragOverlay : "",
            ]
                .filter(Boolean)
                .join(" ")}
            {...(isOverlay ? {} : attributes)}
        >
            <span className={styles.position}>{index + 1}</span>
            <span className={styles.label}>{label}</span>

            <ResultIcon
                isCorrect={state === "default" ? null : state === "correct"}
                className={styles.resultIcon}
            />

            {!isAnswered && (
                <div className={styles.controls}>
                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={onMoveUp}
                        disabled={index === 0}
                        aria-label={`Monter « ${label} »`}
                    >
                        <FontAwesomeIcon icon={faChevronUp} />
                    </button>
                    <button
                        type="button"
                        className={styles.arrowButton}
                        onClick={onMoveDown}
                        disabled={isLast}
                        aria-label={`Descendre « ${label} »`}
                    >
                        <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                    <span
                        className={styles.dragHandle}
                        aria-hidden="true"
                        {...(isOverlay ? {} : { ...listeners })}
                    >
                        <FontAwesomeIcon icon={faGripLines} />
                    </span>
                </div>
            )}
        </li>
    )
}