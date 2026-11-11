import LabeledOptionListEditor from "./LabeledOptionListEditor"
import type { QcmExercise } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface QcmConfigEditorProps {
    config: QcmExercise["config"]
    onChange: (config: QcmExercise["config"]) => void
}

export default function QcmConfigEditor({ config, onChange }: QcmConfigEditorProps) {
    return (
        <div className={styles.section}>
            <span className={styles.label}>Choix de réponse</span>
            <LabeledOptionListEditor options={config.choices} onChange={(choices) => onChange({ ...config, choices })} />

            {config.choices.length > 0 && (
                <label className={styles.field}>
                    <span className={styles.label}>Bonne réponse</span>
                    <select
                        value={config.correctChoiceId}
                        onChange={(e) => onChange({ ...config, correctChoiceId: e.target.value })}
                        className={styles.select}
                    >
                        <option value="" disabled>
                            Choisir la bonne réponse
                        </option>
                        {config.choices.map((choice, i) => (
                            <option key={choice.id} value={choice.id}>
                                {choice.label || `Option ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </div>
    )
}
