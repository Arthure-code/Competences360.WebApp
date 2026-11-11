"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import type { AssociationExercise } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface AssociationConfigEditorProps {
    config: AssociationExercise["config"]
    onChange: (config: AssociationExercise["config"]) => void
}

export default function AssociationConfigEditor({ config, onChange }: AssociationConfigEditorProps) {
    function addTarget() {
        onChange({ ...config, targets: [...config.targets, { id: crypto.randomUUID(), label: "" }] })
    }
    function updateTargetLabel(id: string, label: string) {
        onChange({ ...config, targets: config.targets.map((target) => (target.id === id ? { ...target, label } : target)) })
    }
    function removeTarget(id: string) {
        const nextMap = { ...config.correctMap }
        delete nextMap[id]
        onChange({ ...config, targets: config.targets.filter((target) => target.id !== id), correctMap: nextMap })
    }
    function setCorrectOption(targetId: string, optionId: string) {
        onChange({ ...config, correctMap: { ...config.correctMap, [targetId]: optionId } })
    }

    function addOption() {
        onChange({ ...config, options: [...config.options, { id: crypto.randomUUID(), label: "" }] })
    }
    function updateOptionLabel(id: string, label: string) {
        onChange({ ...config, options: config.options.map((option) => (option.id === id ? { ...option, label } : option)) })
    }
    function removeOption(id: string) {
        const nextMap = Object.fromEntries(Object.entries(config.correctMap).filter(([, optionId]) => optionId !== id))
        onChange({ ...config, options: config.options.filter((option) => option.id !== id), correctMap: nextMap })
    }

    return (
        <div className={styles.section}>
            <span className={styles.label}>Banque d'options (à glisser)</span>
            <div className={styles.list}>
                {config.options.map((option) => (
                    <div key={option.id} className={styles.segmentRow}>
                        <input
                            type="text"
                            value={option.label}
                            onChange={(e) => updateOptionLabel(option.id, e.target.value)}
                            className={styles.input}
                            placeholder="Texte de l'option"
                        />
                        <button type="button" onClick={() => removeOption(option.id)} aria-label="Retirer cette option">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className={styles.addButton} onClick={addOption}>
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter une option
            </button>

            <span className={styles.label}>Cibles et bonnes réponses</span>
            <div className={styles.list}>
                {config.targets.map((target) => (
                    <div key={target.id} className={styles.segmentRow}>
                        <input
                            type="text"
                            value={target.label}
                            onChange={(e) => updateTargetLabel(target.id, e.target.value)}
                            className={styles.input}
                            placeholder="Texte de la cible"
                        />
                        <select
                            value={config.correctMap[target.id] ?? ""}
                            onChange={(e) => setCorrectOption(target.id, e.target.value)}
                            className={styles.select}
                        >
                            <option value="" disabled>
                                Bonne option
                            </option>
                            {config.options.map((option, i) => (
                                <option key={option.id} value={option.id}>
                                    {option.label || `Option ${i + 1}`}
                                </option>
                            ))}
                        </select>
                        <button type="button" onClick={() => removeTarget(target.id)} aria-label="Retirer cette cible">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className={styles.addButton} onClick={addTarget}>
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter une cible
            </button>
        </div>
    )
}
