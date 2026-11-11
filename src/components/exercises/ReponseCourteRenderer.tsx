"use client"

import type { ReponseCourteExercise, ReponseCourteSegment } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import styles from "./ReponseCourteRenderer.module.css"

/** Comparaison insensible à la casse/accents — même règle que lib/exercise-validation.ts */
function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

type BlankState = "default" | "correct" | "incorrect"

type BlankSegment = Extract<ReponseCourteSegment, { type: "blank" }>

export default function ReponseCourteRenderer({
    exercise,
    lastAnswer,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<ReponseCourteExercise>) {
    const blanks = exercise.config.segments.filter(
        (segment): segment is BlankSegment => segment.type === "blank"
    )

    const submittedValues = lastAnswer?.type === "reponse_courte" ? lastAnswer.values : null
    const draftValues = (draft as Record<string, string> | undefined) ?? {}

    const isAnswered = submittedValues !== null
    const allFilled = blanks.every((blank) => draftValues[blank.id]?.trim())

    function updateBlank(blankId: string, value: string) {
        onDraftChange({ ...draftValues, [blankId]: value })
    }

    function handleSubmit() {
        if (!allFilled) return
        onSubmit({ type: "reponse_courte", values: draftValues })
    }

    // Un trou juste est signalé immédiatement (ça n'aide pas à deviner les
    // autres trous) ; un trou faux est signalé en rouge sans révéler la
    // bonne réponse tant que ce n'est pas le résultat final — la bonne
    // réponse complète reste affichée dans le panneau de correction.
    function blankState(blankId: string): BlankState {
        if (!isAnswered) return "default"
        const given = normalize(submittedValues?.[blankId] ?? "")
        if (solution?.type !== "reponse_courte") return "default"

        // Une seule réponse de référence, celle que le serveur rend — les
        // variantes tolérées ne quittent plus le serveur, et n'ont pas à le
        // faire : c'est lui qui a déjà tranché.
        return normalize(solution.values[blankId] ?? "") === given ? "correct" : "incorrect"
    }

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.sentence}>
                {exercise.config.segments.map((segment, index) => {
                    if (segment.type === "text") {
                        return (
                            <span key={index} className={styles.text}>
                                {segment.content}
                            </span>
                        )
                    }

                    const state = blankState(segment.id)
                    const value = isAnswered ? submittedValues?.[segment.id] ?? "" : draftValues[segment.id] ?? ""

                    return (
                        <input
                            key={segment.id}
                            type="text"
                            className={`${styles.blank} ${styles[state]}`}
                            value={value}
                            disabled={isAnswered}
                            onChange={(e) => updateBlank(segment.id, e.target.value)}
                            aria-label={`Réponse ${index + 1}`}
                            autoComplete="off"
                            style={{ width: `${Math.max(value.length, 8)}ch` }}
                        />
                    )
                })}
            </div>

            {!isAnswered && (
                <div className={styles.actionRow}>
                    <Button
                        label="Valider ma réponse"
                        variant="secondary"
                        size="lg"
                        disabled={!allFilled}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}