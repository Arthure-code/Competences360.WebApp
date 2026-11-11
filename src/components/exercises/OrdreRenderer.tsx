"use client"

import { useState } from "react"
import { DndContext, DragOverlay, closestCenter, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import type { OrdreExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import SortableItem from "./SortableItem"
import { useExerciseDndSensors } from "./dnd/useExerciseDndSensors"
import type { BaseAnswerState } from "./dnd/types"
import styles from "./OrdreRenderer.module.css"

export type ItemState = BaseAnswerState

/**
 * Pas de banque séparée — les items à réordonner sont directement la liste
 * manipulée (voir "Ordre" dans EXERCISE_TYPES.md). Moyen principal, toujours
 * visible : deux boutons flèche haut/bas (44x44px min, norme tactile
 *  ). Le drag (dnd-kit) est un bonus pour qui est à l'aise avec
 * le glisser-déposer :
 *
 * - le drag ne se déclenche que depuis la poignée (`SortableItem`) ;
 * - `DragOverlay` fait suivre au curseur un aperçu opaque, sans les
 *   limitations du drag image HTML5 natif ;
 * - les autres items se décalent en douceur (`useSortable` + transform)
 *   pour révéler la véritable position d'insertion, plutôt qu'un simple
 *   "trou" visuel comme dans l'ancienne implémentation HTML5 native.
 *
 * `useExerciseDndSensors({ sortableKeyboard: true })` gère souris/tactile
 * et clavier (flèches une fois la poignée en focus) — voir dnd/ pour ce
 * qui est mutualisé entre mécaniques et pourquoi.
 */
export default function OrdreRenderer({
    exercise,
    lastAnswer,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<OrdreExercise>) {
    const submittedOrder = lastAnswer?.type === "ordre" ? lastAnswer.order : null
    const draftOrder = (draft as string[] | undefined) ?? exercise.config.items.map((item) => item.id)
    const [activeId, setActiveId] = useState<string | null>(null)

    const isAnswered = submittedOrder !== null
    const displayOrder = isAnswered ? submittedOrder : draftOrder
    const itemsById = Object.fromEntries(exercise.config.items.map((item) => [item.id, item]))

    const sensors = useExerciseDndSensors({ sortableKeyboard: true })

    function move(index: number, direction: -1 | 1) {
        const target = index + direction
        if (target < 0 || target >= draftOrder.length) return
        const next = [...draftOrder]
        ;[next[index], next[target]] = [next[target], next[index]]
        onDraftChange(next)
    }

    function itemState(itemId: string, index: number): ItemState {
        if (!isAnswered) return "default"
        if (solution?.type !== "ordre") return "default"

        return itemId === solution.order[index] ? "correct" : "incorrect"
    }

    function handleSubmit() {
        onSubmit({ type: "ordre", order: draftOrder })
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id))
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        if (!over || active.id === over.id) return

        const fromIndex = draftOrder.indexOf(String(active.id))
        const toIndex = draftOrder.indexOf(String(over.id))
        if (fromIndex === -1 || toIndex === -1) return

        onDraftChange(arrayMove(draftOrder, fromIndex, toIndex))
    }

    const activeItem = activeId ? itemsById[activeId] : null
    const activeIndex = activeId ? draftOrder.indexOf(activeId) : -1

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <SortableContext items={displayOrder} strategy={verticalListSortingStrategy} disabled={isAnswered}>
                    <ol className={styles.list}>
                        {displayOrder.map((itemId, index) => {
                            const item = itemsById[itemId]
                            if (!item) return null

                            return (
                                <SortableItem
                                    key={itemId}
                                    id={itemId}
                                    index={index}
                                    label={item.label}
                                    state={itemState(itemId, index)}
                                    isAnswered={isAnswered}
                                    isLast={index === draftOrder.length - 1}
                                    onMoveUp={() => move(index, -1)}
                                    onMoveDown={() => move(index, 1)}
                                />
                            )
                        })}
                    </ol>
                </SortableContext>

                {/* Aperçu opaque qui suit le curseur — voir SortableItem en mode `isOverlay`. */}
                <DragOverlay>
                    {activeItem ? (
                        <SortableItem
                            id={activeId as string}
                            index={activeIndex}
                            label={activeItem.label}
                            state="default"
                            isAnswered={false}
                            isLast={false}
                            onMoveUp={() => {}}
                            onMoveDown={() => {}}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {!isAnswered && (
                <div className={styles.actionRow}>
                    <Button label="Valider ma réponse" variant="secondary" size="lg" onClick={handleSubmit} />
                </div>
            )}
        </div>
    )
}