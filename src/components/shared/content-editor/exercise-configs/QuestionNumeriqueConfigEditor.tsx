import type { QuestionNumeriqueExercise } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface QuestionNumeriqueConfigEditorProps {
    config: QuestionNumeriqueExercise["config"]
    onChange: (config: QuestionNumeriqueExercise["config"]) => void
}

export default function QuestionNumeriqueConfigEditor({ config, onChange }: QuestionNumeriqueConfigEditorProps) {
    return (
        <div className={styles.section}>
            <div className={styles.row}>
                <label className={styles.field}>
                    <span className={styles.label}>Valeur correcte</span>
                    <input
                        type="number"
                        value={config.correctValue}
                        onChange={(e) => onChange({ ...config, correctValue: Number(e.target.value) })}
                        className={styles.input}
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.label}>Tolérance (±)</span>
                    <input
                        type="number"
                        min={0}
                        value={config.tolerance}
                        onChange={(e) => onChange({ ...config, tolerance: Number(e.target.value) })}
                        className={styles.input}
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.label}>Unité (facultatif)</span>
                    <input
                        type="text"
                        value={config.unit ?? ""}
                        onChange={(e) => onChange({ ...config, unit: e.target.value || undefined })}
                        className={styles.input}
                        placeholder="$, %, min..."
                    />
                </label>
            </div>
        </div>
    )
}
