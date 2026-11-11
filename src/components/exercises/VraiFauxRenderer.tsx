"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import type { VraiFauxExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "@/components/exercises/ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import styles from "./VraiFauxRenderer.module.css"

const OPTIONS: { value: boolean; label: string; icon: typeof faCheck }[] = [
    { value: true, label: "Vrai", icon: faCheck },
    { value: false, label: "Faux", icon: faXmark },
]

type OptionState = "default" | "selected" | "correct" | "incorrect"

export default function VraiFauxRenderer({
    exercise,
    lastAnswer,
    isLocked,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<VraiFauxExercise>) {
    const submittedValue = lastAnswer?.type === "vrai_faux" ? lastAnswer.value : null
    const draftValue = (draft as boolean | undefined) ?? null

    const isAnswered = submittedValue !== null

    function handleSubmit() {
        if (draftValue === null) return
        onSubmit({ type: "vrai_faux", value: draftValue })
    }

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.options}>
                {OPTIONS.map((option) => {
                    const isCorrectChoice =
                        solution?.type === "vrai_faux" && option.value === solution.value
                    const isSelected = option.value === submittedValue

                    let state: OptionState = "default"
                    if (isAnswered) {
                        if (isLocked && isCorrectChoice) state = "correct"
                        else if (isSelected) state = "incorrect"
                    } else if (draftValue === option.value) {
                        state = "selected"
                    }

                    return (
                        <button
                            key={option.label}
                            type="button"
                            className={`${styles.option} ${styles[state]}`}
                            onClick={() => !isAnswered && onDraftChange(option.value)}
                            disabled={isAnswered}
                            aria-pressed={draftValue === option.value}
                        >
                            <span className={styles.icon}>
                                <FontAwesomeIcon icon={option.icon} />
                            </span>
                            {option.label}
                        </button>
                    )
                })}
            </div>

            {!isAnswered && (
                <div className={styles.actionRow}>
                    <Button
                        label="Valider ma réponse"
                        variant="secondary"
                        size="lg"
                        disabled={draftValue === null}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}