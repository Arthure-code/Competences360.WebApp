"use client"

import { useState } from "react"
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core"
import type { AssociationExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import OptionChip from "./OptionChip"
import TargetSlot from "./TargetSlot"
import { useExerciseDndSensors } from "./dnd/useExerciseDndSensors"
import type { BaseAnswerState } from "./dnd/types"
import styles from "./AssociationRenderer.module.css"

export type SlotState = BaseAnswerState | "filled"

/**
 * Deux colonnes : cibles fixes (gauche) + banque d'options (droite, ou en
 * dessous sur mobile). Le tap-tap reste la méthode principale et fiable au
 * tactile : on sélectionne une chip dans la banque, puis on tape la cible
 * visée pour l'y placer — une chip déjà placée peut être retirée d'un tap
 * sur sa case.
 *
 * Le drag (dnd-kit, `useDraggable`/`useDroppable`) est un bonus en plus du
 * tap-tap, pas un remplacement :
 * - `DragOverlay` fait suivre au curseur un aperçu opaque de la chip ;
 * - chaque cible se surligne (`isOver`, voir TargetSlot) pendant qu'une
 *   chip est glissée au-dessus, avant même le drop ;
 * - contrairement à OrdreRenderer, il n'y a pas de tri à faire ici — une
 *   chip va d'une "zone" (banque ou cible) à une autre, d'où
 *   `useDraggable`/`useDroppable` plutôt que `useSortable`.
 *
 * `useExerciseDndSensors()` (sans `sortableKeyboard`, il n'y a pas d'ordre
 * linéaire ici) laisse cohabiter tap et drag sans conflit — voir dnd/ pour
 * ce qui est mutualisé entre mécaniques.
 */
export default function AssociationRenderer({
    exercise,
    lastAnswer,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<AssociationExercise>) {
    const submittedMap = lastAnswer?.type === "association" ? lastAnswer.map : null
    const draftMap = (draft as Record<string, string> | undefined) ?? {}
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
    const [activeOptionId, setActiveOptionId] = useState<string | null>(null)

    const isAnswered = submittedMap !== null
    const displayMap = isAnswered ? submittedMap : draftMap

    const optionsById = Object.fromEntries(exercise.config.options.map((option) => [option.id, option]))
    const assignedOptionIds = new Set(Object.values(displayMap))
    const bankOptions = exercise.config.options.filter((option) => !assignedOptionIds.has(option.id))
    const allAssigned = exercise.config.targets.every((target) => draftMap[target.id])

    const sensors = useExerciseDndSensors()

    function assign(targetId: string, optionId: string) {
        const next = { ...draftMap }
        // Une option ne peut être assignée qu'à une seule cible à la fois.
        for (const key of Object.keys(next)) {
            if (next[key] === optionId) delete next[key]
        }
        next[targetId] = optionId
        onDraftChange(next)
        setSelectedOptionId(null)
    }

    function unassign(targetId: string) {
        const next = { ...draftMap }
        delete next[targetId]
        onDraftChange(next)
    }

    function handleOptionTap(optionId: string) {
        if (isAnswered) return
        setSelectedOptionId((prev) => (prev === optionId ? null : optionId))
    }

    function handleTargetTap(targetId: string) {
        if (isAnswered) return
        if (selectedOptionId) {
            assign(targetId, selectedOptionId)
        } else if (draftMap[targetId]) {
            unassign(targetId)
        }
    }

    function slotState(targetId: string): SlotState {
        const optionId = displayMap[targetId]
        if (!isAnswered) return optionId ? "filled" : "default"
        if (solution?.type !== "association") return "default"

        return optionId === solution.map[targetId] ? "correct" : "incorrect"
    }

    function handleSubmit() {
        if (!allAssigned) return
        onSubmit({ type: "association", map: draftMap })
    }

    function handleDragStart(event: DragStartEvent) {
        setSelectedOptionId(null)
        setActiveOptionId(String(event.active.id))
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveOptionId(null)
        if (!over) return
        assign(String(over.id), String(active.id))
    }

    const activeOption = activeOptionId ? optionsById[activeOptionId] : null

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveOptionId(null)}
            >
                <div className={styles.board}>
                    <div className={styles.targets}>
                        {exercise.config.targets.map((target) => {
                            const optionId = displayMap[target.id]
                            const option = optionId ? optionsById[optionId] : null

                            return (
                                <TargetSlot
                                    key={target.id}
                                    id={target.id}
                                    label={target.label}
                                    optionLabel={option?.label ?? null}
                                    state={slotState(target.id)}
                                    isAnswered={isAnswered}
                                    onTap={() => handleTargetTap(target.id)}
                                />
                            )
                        })}
                    </div>

                    {!isAnswered && (
                        <div className={styles.bank}>
                            {bankOptions.map((option) => (
                                <OptionChip
                                    key={option.id}
                                    id={option.id}
                                    label={option.label}
                                    isSelected={selectedOptionId === option.id}
                                    onTap={() => handleOptionTap(option.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Aperçu opaque qui suit le curseur — voir OptionChip en mode `isOverlay`. */}
                <DragOverlay>
                    {activeOption ? (
                        <OptionChip id={activeOption.id} label={activeOption.label} isSelected={false} onTap={() => {}} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {!isAnswered && (
                <div className={styles.actionRow}>
                    <Button
                        label="Valider ma réponse"
                        variant="secondary"
                        size="lg"
                        disabled={!allAssigned}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}