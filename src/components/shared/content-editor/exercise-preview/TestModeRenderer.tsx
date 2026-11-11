"use client"

import { useState } from "react"
import { EXERCISE_RENDERERS } from "@/components/exercises/registry"
import CorrectionPanel from "@/components/exercises/CorrectionPanel"
import { checkExerciseAnswer, solutionAsAnswer, type ExerciseAnswer } from "@/lib/exerciseValidation"
import type { Exercise } from "@/types/exercise"
import type { ExerciseAttemptState, ExerciseResult } from "@/hooks/useNiveauProgress"
import styles from "./TestModeRenderer.module.css"

const EMPTY_ATTEMPT: ExerciseAttemptState = {
    attemptsCount: 0,
    lastAnswer: null,
    lastAnswerCorrect: null,
    result: null,
    score: null,
}

interface TestModeRendererProps {
    exercise: Exercise
}

/**
 * Rejoue le VRAI renderer apprenant + le VRAI CorrectionPanel (registry.ts,
 * CorrectionPanel.tsx) — même mécanique à 2 essais qu'en conditions
 * réelles, mais un état purement local, jamais persisté, remis à zéro à
 * chaque bascule vers ce mode.
 *
 * Seul endroit où la correction reste dans le navigateur : le parcours
 * apprenant, lui, la demande au serveur (useNiveauProgress.submitAnswer).
 * Ici le formateur relit SON propre contenu, solutions comprises ; le noter
 * ou journaliser sa tentative n'aurait aucun sens.
 */
export default function TestModeRenderer({ exercise }: TestModeRendererProps) {
    const [draft, setDraft] = useState<unknown>(undefined)
    const [attempt, setAttempt] = useState<ExerciseAttemptState>(EMPTY_ATTEMPT)
    const [isPanelOpen, setPanelOpen] = useState(false)

    const Renderer = EXERCISE_RENDERERS[exercise.type]
    if (!Renderer) {
        return <p className={styles.unavailable}>Aperçu non disponible pour ce type.</p>
    }

    const isCurrentLocked = attempt.result !== null

    function handleSubmit(answer: ExerciseAnswer) {
        const isCorrect = checkExerciseAnswer(exercise, answer)
        const attemptsCount = attempt.attemptsCount + 1
        const isFinalFailure = !isCorrect && attemptsCount >= 2
        const result: ExerciseResult | null = isCorrect ? "success" : isFinalFailure ? "revealed" : null

        setAttempt({
            attemptsCount,
            lastAnswer: answer,
            lastAnswerCorrect: isCorrect,
            result,
            score: isCorrect ? 1 : isFinalFailure ? 0.25 : null,
            // Le panneau attend la solution dans la forme d'une réponse,
            // comme l'API la rend en conditions réelles.
            bonneReponse: result === null ? null : solutionAsAnswer(exercise),
            feedbackCorrection: exercise.explanation,
        })
        setPanelOpen(true)
    }

    function handleRetry() {
        setAttempt((prev) => ({ ...prev, lastAnswer: null, lastAnswerCorrect: null }))
        setDraft(undefined)
        setPanelOpen(false)
    }

    function handleReveal() {
        setAttempt((prev) => ({
            ...prev,
            result: "revealed",
            score: 0.25,
            bonneReponse: solutionAsAnswer(exercise),
            feedbackCorrection: exercise.explanation,
        }))
    }

    function handleReset() {
        setDraft(undefined)
        setAttempt(EMPTY_ATTEMPT)
        setPanelOpen(false)
    }

    return (
        <div className={styles.wrapper}>
            <Renderer
                exercise={exercise}
                lastAnswer={attempt.lastAnswer}
                isLocked={isCurrentLocked}
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={handleSubmit}
                solution={attempt.bonneReponse}
            />

            {attempt.attemptsCount > 0 && (
                <CorrectionPanel
                    isOpen={isPanelOpen}
                    onOpenChange={setPanelOpen}
                    exercise={exercise}
                    attempt={attempt}
                    positionLabel="Mode test — aucune donnée conservée"
                    onRetry={handleRetry}
                    onReveal={handleReveal}
                    onNext={handleReset}
                    hasNext={true}
                    bilanHref="#"
                />
            )}
        </div>
    )
}