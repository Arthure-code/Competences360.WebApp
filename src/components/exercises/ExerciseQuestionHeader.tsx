import type { Exercise } from "@/types/exercise"
import AudioButton from "@/components/ui/AudioButton"
import { EXERCISE_TAG_LABELS } from "@/lib/exerciseLabels"
import styles from "./ExerciseQuestionHeader.module.css"

interface ExerciseQuestionHeaderProps {
    exercise: Exercise
}


export default function ExerciseQuestionHeader({ exercise }: ExerciseQuestionHeaderProps) {
    return (
        <div className={styles.header}>
            <div className={styles.tagRow}>
                <span className={styles.tag}>{EXERCISE_TAG_LABELS[exercise.type]}</span>
                <AudioButton text={exercise.prompt} />
            </div>

            <h2 className={styles.prompt}>{exercise.prompt}</h2>

            {exercise.media?.type === "image" && (
                <img src={exercise.media.url} alt={exercise.media.alt ?? ""} className={styles.media} />
            )}
        </div>
    )
}
