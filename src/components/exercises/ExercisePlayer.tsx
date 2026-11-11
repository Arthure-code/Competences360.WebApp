"use client"

import type { Exercise } from "@/types/exercise"
import { useNiveauProgress } from "@/hooks/useNiveauProgress"
import { routes } from "@/constants/routes"
import ExerciseStepper from "./ExerciseStepper"
import CorrectionPanel from "./CorrectionPanel"
import { EXERCISE_RENDERERS } from "@/components/exercises/registry"
import styles from "./ExercisePlayer.module.css"

interface ExercisePlayerProps {
    exercises: Exercise[]
    moduleSlug: string
    niveauSlug: string
    initialIndex?: number
}

export default function ExercisePlayer({ exercises, moduleSlug, niveauSlug, initialIndex = 0 }: ExercisePlayerProps) {
    const progress = useNiveauProgress({ exercises, initialIndex })
    const { currentExercise } = progress

    if (!currentExercise) {
        return <p className={styles.empty}>Aucun exercice disponible pour ce niveau.</p>
    }

    const Renderer = EXERCISE_RENDERERS[currentExercise.type]
    const bilanHref = routes.apprenant.modules.bilan(moduleSlug, niveauSlug)

    return (
        <div className={styles.player}>
            <ExerciseStepper
                exercises={exercises}
                currentIndex={progress.currentIndex}
                getStatus={progress.getStepperStatus}
                onSelect={progress.goToExercise}
            />


            {progress.erreurCorrection && (
                <p className={styles.erreur} role="alert">
                    {progress.erreurCorrection}
                </p>
            )}

            <div className={styles.content}>
                {Renderer ? (
                    <Renderer
                        exercise={currentExercise}
                        lastAnswer={progress.currentAttempt.lastAnswer}
                        isLocked={progress.isCurrentLocked}
                        draft={progress.getDraft(currentExercise.id)}
                        onDraftChange={(value) => progress.setDraft(currentExercise.id, value)}
                        onSubmit={progress.submitAnswer}
                        solution={progress.currentAttempt.bonneReponse}
                    />
                ) : (
                    <p className={styles.comingSoon}>
                        Le rendu du type « {currentExercise.type} » n'est pas encore disponible.
                    </p>
                )}
            </div>


            <CorrectionPanel
                isOpen={progress.isPanelOpen}
                onOpenChange={progress.setPanelOpen}
                exercise={currentExercise}
                attempt={progress.currentAttempt}
                positionLabel={`Exercice ${progress.currentIndex + 1} sur ${exercises.length}`}
                onRetry={progress.retry}
                onReveal={progress.revealAnswer}
                onNext={progress.goToNext}
                hasNext={progress.currentIndex < exercises.length - 1}
                bilanHref={bilanHref}
            />
        </div>
    )
}