"use client"

import type { QcmExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "@/components/exercises/ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import styles from "./QcmRenderer.module.css"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

type ChoiceState = "default" | "selected" | "correct" | "incorrect"

export default function QcmRenderer({
    exercise,
    lastAnswer,
    isLocked,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<QcmExercise>) {
    const submittedChoiceId = lastAnswer?.type === "qcm" ? lastAnswer.choiceId : null

    const draftId = (draft as string | undefined) ?? null

    const isAnswered = submittedChoiceId !== null

    function handleSubmit() {
        if (!draftId) return
        onSubmit({ type: "qcm", choiceId: draftId })
    }

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.choices}>
                {exercise.config.choices.map((choice, index) => {
                    // Le bon choix vient du serveur : la config ne le porte plus.
                    const isCorrectChoice =
                        solution?.type === "qcm" && choice.id === solution.choiceId
                    const isSelected = choice.id === submittedChoiceId

                    let state: ChoiceState = "default"
                    if (isAnswered) {
                        // Tant que ce n'est pas le résultat final, on ne
                        // révèle pas la bonne réponse — seule la sélection
                        // fautive est signalée, pour laisser la place au
                        // réessai (voir "Logique de réussite" dans le .md).
                        if (isLocked && isCorrectChoice) state = "correct"
                        else if (isSelected) state = "incorrect"
                    } else if (draftId === choice.id) {
                        state = "selected"
                    }

                    return (
                        <button
                            key={choice.id}
                            type="button"
                            className={`${styles.choice} ${styles[state]}`}
                            onClick={() => !isAnswered && onDraftChange(choice.id)}
                            disabled={isAnswered}
                            aria-pressed={draftId === choice.id}
                        >
                            <span className={styles.letter}>{LETTERS[index] ?? index + 1}</span>
                            <span className={styles.label}>{choice.label}</span>
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
                        disabled={!draftId}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}