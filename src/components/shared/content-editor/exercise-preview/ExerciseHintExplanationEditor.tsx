import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import styles from "./ExerciseHintExplanationEditor.module.css"

interface ExerciseHintExplanationEditorProps {
    hint?: string
    explanation?: string
    onHintChange: (value: string) => void
    onExplanationChange: (value: string) => void
}

/** Partagé par les 8 types — indice/explication ne dépendent jamais de `config`. */
export default function ExerciseHintExplanationEditor({
    hint,
    explanation,
    onHintChange,
    onExplanationChange,
}: ExerciseHintExplanationEditorProps) {
    return (
        <div className={styles.wrapper}>
            <label className={styles.field}>
                <span className={styles.label}>Indice (facultatif)</span>
                <input
                    type="text"
                    value={hint ?? ""}
                    onChange={(e) => onHintChange(e.target.value)}
                    className={styles.input}
                    placeholder="Affiché sur demande avant la fin de l'exercice"
                    maxLength={CONTENT_TEXT_LIMITS.exerciseHint}
                />
                <span className={styles.charCount}>
                    {(hint ?? "").length}/{CONTENT_TEXT_LIMITS.exerciseHint}
                </span>
            </label>

            <label className={styles.field}>
                <span className={styles.label}>Explication (facultatif)</span>
                <textarea
                    value={explanation ?? ""}
                    onChange={(e) => onExplanationChange(e.target.value)}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Affichée dans la correction une fois terminé — de quoi expliquer une explication sensée, pas juste un mot"
                    maxLength={CONTENT_TEXT_LIMITS.exerciseExplanation}
                />
                <span className={styles.charCount}>
                    {(explanation ?? "").length}/{CONTENT_TEXT_LIMITS.exerciseExplanation}
                </span>
            </label>
        </div>
    )
}