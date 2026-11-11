import type { Exercise } from "@/types/exercise"
import type { StepperStatus } from "@/hooks/useNiveauProgress"
import styles from "./ExerciseStepper.module.css"

interface ExerciseStepperProps {
    exercises: Exercise[]
    currentIndex: number
    getStatus: (exercise: Exercise) => StepperStatus
    onSelect: (index: number) => void
}

const STATUS_CLASS: Record<StepperStatus, string> = {
    "a-faire": styles.aFaire,
    "en-cours": styles.enCours,
    reussi: styles.reussi,
    echoue: styles.echoue,
}

const STATUS_LABEL: Record<StepperStatus, string> = {
    "a-faire": "à faire",
    "en-cours": "en cours, réessai possible",
    reussi: "réussi",
    echoue: "échoué",
}

/**
 * Navigation libre par numéros — l'apprenant peut sauter directement à
 * n'importe quel exercice non encore soumis, dans n'importe quel ordre .
 *  Pas d'état visuel "verrouillé" pour un
 * exercice simplement dépassé sans réponse : il reste cliquable comme les
 * autres, donc son style ne doit pas suggérer le contraire.
 */
export default function ExerciseStepper({ exercises, currentIndex, getStatus, onSelect }: ExerciseStepperProps) {
    return (
        <nav className={styles.stepper} aria-label="Navigation entre les exercices">
            {exercises.map((exercise, index) => {
                const status = getStatus(exercise)
                const isCurrent = index === currentIndex
                return (
                    <button
                        key={exercise.id}
                        type="button"
                        className={`${styles.pill} ${STATUS_CLASS[status]} ${isCurrent ? styles.current : ""}`}
                        onClick={() => onSelect(index)}
                        aria-current={isCurrent ? "step" : undefined}
                        aria-label={`Exercice ${index + 1} — ${STATUS_LABEL[status]}`}
                    >
                        {index + 1}
                    </button>
                )
            })}
        </nav>
    )
}
