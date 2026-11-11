"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import type { OrdreExercise } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface OrdreConfigEditorProps {
    config: OrdreExercise["config"]
    onChange: (config: OrdreExercise["config"]) => void
}

/**
 * `items` reste dans l'ordre PRÉSENTÉ à l'apprenant — volontairement pas
 * l'ordre correct, sinon l'exercice serait déjà résolu à l'affichage (voir
 * OrdreRenderer, qui utilise l'ordre stocké tel quel comme point de départ).
 * `correctOrder` se définit séparément, via un numéro de position par
 * élément.
 */
export default function OrdreConfigEditor({ config, onChange }: OrdreConfigEditorProps) {
    function addItem() {
        const newItem = { id: crypto.randomUUID(), label: "" }
        onChange({ items: [...config.items, newItem], correctOrder: [...config.correctOrder, newItem.id] })
    }
    function updateLabel(id: string, label: string) {
        onChange({ ...config, items: config.items.map((item) => (item.id === id ? { ...item, label } : item)) })
    }
    function removeItem(id: string) {
        onChange({
            items: config.items.filter((item) => item.id !== id),
            correctOrder: config.correctOrder.filter((itemId) => itemId !== id),
        })
    }
    function updatePosition(id: string, position: number) {
        const withoutId = config.correctOrder.filter((itemId) => itemId !== id)
        const clamped = Math.max(1, Math.min(position, withoutId.length + 1))
        withoutId.splice(clamped - 1, 0, id)
        onChange({ ...config, correctOrder: withoutId })
    }

    return (
        <div className={styles.section}>
            <span className={styles.label}>Éléments à réordonner (numéro = position correcte)</span>
            <div className={styles.list}>
                {config.items.map((item) => (
                    <div key={item.id} className={styles.segmentRow}>
                        <input
                            type="number"
                            min={1}
                            max={config.items.length}
                            value={config.correctOrder.indexOf(item.id) + 1}
                            onChange={(e) => updatePosition(item.id, Number(e.target.value))}
                            className={styles.positionInput}
                            aria-label="Position correcte"
                        />
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateLabel(item.id, e.target.value)}
                            className={styles.input}
                            placeholder="Texte de l'élément"
                        />
                        <button type="button" onClick={() => removeItem(item.id)} aria-label="Retirer cet élément">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className={styles.addButton} onClick={addItem}>
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un élément
            </button>
        </div>
    )
}
