import type { VraiFauxExercise } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface VraiFauxConfigEditorProps {
    config: VraiFauxExercise["config"]
    onChange: (config: VraiFauxExercise["config"]) => void
}

export default function VraiFauxConfigEditor({ config, onChange }: VraiFauxConfigEditorProps) {
    return (
        <fieldset className={styles.section}>
            <legend className={styles.label}>Bonne réponse</legend>
            <label className={styles.radioOption}>
                <input
                    type="radio"
                    name="vraiFaux"
                    checked={config.correctAnswer === true}
                    onChange={() => onChange({ correctAnswer: true })}
                />
                Vrai
            </label>
            <label className={styles.radioOption}>
                <input
                    type="radio"
                    name="vraiFaux"
                    checked={config.correctAnswer === false}
                    onChange={() => onChange({ correctAnswer: false })}
                />
                Faux
            </label>
        </fieldset>
    )
}
