"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import type { LabeledOption } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface LabeledOptionListEditorProps {
    options: LabeledOption[]
    onChange: (options: LabeledOption[]) => void
    addLabel?: string
    placeholder?: string
}

/** Réutilisé par qcm (choices), ordre (items) et association (options) — même format {id, label}. */
export default function LabeledOptionListEditor({
    options,
    onChange,
    addLabel = "Ajouter une option",
    placeholder = "Texte de l'option",
}: LabeledOptionListEditorProps) {
    function addOption() {
        onChange([...options, { id: crypto.randomUUID(), label: "" }])
    }
    function updateLabel(id: string, label: string) {
        onChange(options.map((option) => (option.id === id ? { ...option, label } : option)))
    }
    function removeOption(id: string) {
        onChange(options.filter((option) => option.id !== id))
    }

    return (
        <div className={styles.list}>
            {options.map((option) => (
                <div key={option.id} className={styles.segmentRow}>
                    <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateLabel(option.id, e.target.value)}
                        className={styles.input}
                        placeholder={placeholder}
                    />
                    <button type="button" onClick={() => removeOption(option.id)} aria-label="Retirer cette option">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            ))}
            <button type="button" className={styles.addButton} onClick={addOption}>
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                {addLabel}
            </button>
        </div>
    )
}
