"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import type { ZoneCliquableExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import styles from "./ZoneCliquableRenderer.module.css"

type ZoneState = "default" | "selected" | "correct" | "incorrect"

/**
 * Comme tous les autres types, le tap sélectionne une zone sans corriger —
 * il faut appuyer sur "Valider ma réponse" pour déclencher la correction
 * (même flux que QCM/Vrai-Faux, voir "Logique de réussite" dans le .md).
 * Les zones ont un contour pointillé discret dès le départ (affordance),
 * jamais invisible : on ne fait jamais deviner qu'un élément est cliquable.
 */
export default function ZoneCliquableRenderer({
    exercise,
    lastAnswer,
    isLocked,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<ZoneCliquableExercise>) {
    const submittedZoneId = lastAnswer?.type === "zone_cliquable" ? lastAnswer.zoneId : null
    const draftZoneId = (draft as string | undefined) ?? null

    const isAnswered = submittedZoneId !== null

    function handleSubmit() {
        if (!draftZoneId) return
        onSubmit({ type: "zone_cliquable", zoneId: draftZoneId })
    }

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.imageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={exercise.config.image.url}
                    alt={exercise.config.image.alt ?? ""}
                    className={styles.image}
                />

                {exercise.config.zones.map((zone, index) => {
                    const isSelected = zone.id === submittedZoneId

                    let state: ZoneState = "default"
                    if (isAnswered) {
                        const estBonneZone =
                            solution?.type === "zone_cliquable" && zone.id === solution.zoneId

                        if (isLocked && estBonneZone) state = "correct"
                        else if (isSelected) state = "incorrect"
                    } else if (draftZoneId === zone.id) {
                        state = "selected"
                    }

                    return (
                        <button
                            key={zone.id}
                            type="button"
                            className={`${styles.zone} ${styles[state]}`}
                            style={{
                                left: `${zone.x}%`,
                                top: `${zone.y}%`,
                                width: `${zone.width}%`,
                                height: `${zone.height}%`,
                            }}
                            onClick={() => !isAnswered && onDraftChange(zone.id)}
                            disabled={isAnswered}
                            aria-pressed={draftZoneId === zone.id}
                            aria-label={`Zone ${index + 1}`}
                        >
                            {(state === "correct" || state === "incorrect") && (
                                <span className={styles.resultIcon}>
                                    <FontAwesomeIcon icon={state === "correct" ? faCheck : faXmark} />
                                </span>
                            )}
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
                        disabled={!draftZoneId}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}