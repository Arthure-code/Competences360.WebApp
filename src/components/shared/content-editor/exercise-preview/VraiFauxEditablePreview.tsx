"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import type { VraiFauxExercise } from "@/types/exercise"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import vraiFauxStyles from "@/components/exercises/VraiFauxRenderer.module.css"
import styles from "./VraiFauxEditablePreview.module.css"

const OPTIONS: { value: boolean; label: string; icon: typeof faCheck }[] = [
    { value: true, label: "Vrai", icon: faCheck },
    { value: false, label: "Faux", icon: faXmark },
]

interface VraiFauxEditablePreviewProps {
    exercise: VraiFauxExercise
    onConfigChange: (config: VraiFauxExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Rien à écrire ici — Vrai/Faux sont fixes. Un clic direct sur l'option
 * marque la bonne réponse (réutilise .correct de VraiFauxRenderer.module.css
 * tel quel, même code couleur que ce que l'apprenant verrait une fois
 * verrouillé).
 */
export default function VraiFauxEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: VraiFauxEditablePreviewProps) {
    return (
        <div className={vraiFauxStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Vrai ou faux</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de l'affirmation"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={vraiFauxStyles.options}>
                {OPTIONS.map((option) => {
                    const isCorrect = exercise.config.correctAnswer === option.value
                    return (
                        <button
                            key={option.label}
                            type="button"
                            className={`${vraiFauxStyles.option} ${isCorrect ? vraiFauxStyles.correct : ""}`}
                            onClick={() => onConfigChange({ correctAnswer: option.value })}
                            aria-pressed={isCorrect}
                        >
                            <span className={vraiFauxStyles.icon}>
                                <FontAwesomeIcon icon={option.icon} />
                            </span>
                            {option.label}
                            {isCorrect && <span className={styles.correctTag}>Bonne réponse</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
