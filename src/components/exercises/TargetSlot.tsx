"use client"

import { useDroppable } from "@dnd-kit/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import ResultIcon from "./dnd/ResultIcon"
import type { SlotState } from "./AssociationRenderer"
import styles from "./AssociationRenderer.module.css"

interface TargetSlotProps {
    id: string
    label: string
    optionLabel: string | null
    state: SlotState
    isAnswered: boolean
    onTap: () => void
}

/**
 * Une cible. `useDroppable` la rend réceptive au drag — elle n'a pas besoin
 * d'être draggable elle-même, seulement de savoir si une chip la survole
 * (`isOver`) pour se surligner en feedback avant même le drop. Le tap
 * (`onTap`) reste géré par le parent, identique au comportement d'avant.
 */
export default function TargetSlot({ id, label, optionLabel, state, isAnswered, onTap }: TargetSlotProps) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled: isAnswered })

    return (
        <div className={styles.targetRow}>
            <span className={styles.targetLabel}>{label}</span>
            <button
                ref={setNodeRef}
                type="button"
                className={[styles.slot, styles[state], isOver ? styles.slotOver : ""].filter(Boolean).join(" ")}
                onClick={onTap}
                disabled={isAnswered}
            >
                {optionLabel ? (
                    <span className={styles.slotChip}>{optionLabel}</span>
                ) : (
                    <span className={styles.slotPlaceholder}>Déposez ici</span>
                )}

                <ResultIcon
                    isCorrect={state === "correct" || state === "incorrect" ? state === "correct" : null}
                    className={styles.resultIcon}
                />

                {!isAnswered && optionLabel && (
                    <span className={styles.removeIcon} aria-hidden="true">
                        <FontAwesomeIcon icon={faCircleXmark} />
                    </span>
                )}
            </button>
        </div>
    )
}