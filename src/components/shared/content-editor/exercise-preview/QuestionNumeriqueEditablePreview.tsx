"use client"

import type { QuestionNumeriqueExercise } from "@/types/exercise"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import qnStyles from "@/components/exercises/QuestionNumeriqueRenderer.module.css"
import styles from "./QuestionNumeriqueEditablePreview.module.css"

interface QuestionNumeriqueEditablePreviewProps {
    exercise: QuestionNumeriqueExercise
    onConfigChange: (config: QuestionNumeriqueExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/** Le champ de réponse lui-même (qnStyles.field) devient directement éditable — pas de bouton +/- ici, ceux-là sont pour l'apprenant qui ajuste sa saisie, pas pour définir la bonne réponse. */
export default function QuestionNumeriqueEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: QuestionNumeriqueEditablePreviewProps) {
    return (
        <div className={qnStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Réponse numérique</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={qnStyles.fieldRow}>
                <input
                    type="number"
                    value={exercise.config.correctValue}
                    onChange={(e) => onConfigChange({ ...exercise.config, correctValue: Number(e.target.value) })}
                    className={qnStyles.field}
                    aria-label="Bonne réponse"
                />
                <input
                    type="text"
                    value={exercise.config.unit ?? ""}
                    onChange={(e) => onConfigChange({ ...exercise.config, unit: e.target.value || undefined })}
                    className={`${qnStyles.unit} ${styles.unitInput}`}
                    placeholder="unité"
                    aria-label="Unité"
                    maxLength={10}
                />
            </div>

            <div className={styles.toleranceRow}>
                <label className={styles.toleranceLabel}>
                    Tolérance acceptée : ±
                    <input
                        type="number"
                        min={0}
                        value={exercise.config.tolerance}
                        onChange={(e) => onConfigChange({ ...exercise.config, tolerance: Number(e.target.value) })}
                        className={styles.toleranceInput}
                        aria-label="Tolérance"
                    />
                    {exercise.config.unit}
                </label>
            </div>
        </div>
    )
}
