"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronUp, faChevronDown, faTrash, faPlus, faShuffle } from "@fortawesome/free-solid-svg-icons"
import type { OrdreExercise } from "@/types/exercise"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import ordreStyles from "@/components/exercises/OrdreRenderer.module.css"
import styles from "./OrdreEditablePreview.module.css"

interface OrdreEditablePreviewProps {
    exercise: OrdreExercise
    onConfigChange: (config: OrdreExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Réutilise .list/.item/.position/.label/.controls/.arrowButton du VRAI
 * OrdreRenderer (via SortableItem) — pas de drag ici (inutile à l'édition,
 * réservé au mode Test qui rejoue le vrai composant), juste les mêmes
 * flèches haut/bas que l'apprenant utilise, plus un bouton supprimer
 * (propre à l'éditeur, absent du rendu apprenant).
 *
 * Éditer = arranger les éléments dans le BON ordre (haut = 1er) — ça
 * définit `correctOrder` directement, toujours affiché dans cet ordre
 * pendant l'édition. Un bouton "Mélanger" scramble ensuite `items`
 * (l'ordre présenté à l'apprenant au départ) — sans ça, l'exercice serait
 * déjà résolu à l'affichage (OrdreRenderer affiche `items` tel quel comme
 * point de départ).
 */
export default function OrdreEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: OrdreEditablePreviewProps) {
    const [editingItemId, setEditingItemId] = useState<string | null>(null)

    const orderedItems = exercise.config.correctOrder
        .map((id) => exercise.config.items.find((item) => item.id === id))
        .filter((item): item is OrdreExercise["config"]["items"][number] => Boolean(item))

    const isShuffled = exercise.config.items.map((i) => i.id).join(",") !== exercise.config.correctOrder.join(",")

    function updateLabel(itemId: string, label: string) {
        onConfigChange({
            ...exercise.config,
            items: exercise.config.items.map((item) => (item.id === itemId ? { ...item, label } : item)),
        })
    }

    function addItem() {
        const newItem = { id: crypto.randomUUID(), label: "" }
        onConfigChange({
            items: [...exercise.config.items, newItem],
            correctOrder: [...exercise.config.correctOrder, newItem.id],
        })
        setEditingItemId(newItem.id)
    }

    function removeItem(itemId: string) {
        onConfigChange({
            items: exercise.config.items.filter((item) => item.id !== itemId),
            correctOrder: exercise.config.correctOrder.filter((id) => id !== itemId),
        })
    }

    function move(index: number, direction: -1 | 1) {
        const target = index + direction
        if (target < 0 || target >= exercise.config.correctOrder.length) return
        const next = [...exercise.config.correctOrder]
        ;[next[index], next[target]] = [next[target], next[index]]
        onConfigChange({ ...exercise.config, correctOrder: next })
    }

    function shuffle() {
        const shuffled = [...exercise.config.items]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        onConfigChange({ ...exercise.config, items: shuffled })
    }

    return (
        <div className={ordreStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Mettre en ordre</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <p className={styles.instructions}>Arrangez les éléments dans le bon ordre (1ᵉʳ en haut) :</p>

            <ol className={ordreStyles.list}>
                {orderedItems.map((item, index) => (
                    <li key={item.id} className={ordreStyles.item}>
                        <span className={ordreStyles.position}>{index + 1}</span>

                        {editingItemId === item.id ? (
                            <input
                                type="text"
                                autoFocus
                                value={item.label}
                                onChange={(e) => updateLabel(item.id, e.target.value)}
                                onBlur={() => setEditingItemId(null)}
                                onKeyDown={(e) => e.key === "Enter" && setEditingItemId(null)}
                                className={styles.itemInput}
                                maxLength={CONTENT_TEXT_LIMITS.ordreItemLabel}
                            />
                        ) : (
                            <span
                                onClick={() => setEditingItemId(item.id)}
                                className={`${ordreStyles.label} ${styles.itemLabel}`}
                            >
                                {item.label || "Cliquer pour écrire..."}
                            </span>
                        )}

                        <div className={ordreStyles.controls}>
                            <button
                                type="button"
                                className={ordreStyles.arrowButton}
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                aria-label="Monter"
                            >
                                <FontAwesomeIcon icon={faChevronUp} />
                            </button>
                            <button
                                type="button"
                                className={ordreStyles.arrowButton}
                                onClick={() => move(index, 1)}
                                disabled={index === orderedItems.length - 1}
                                aria-label="Descendre"
                            >
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                            <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => removeItem(item.id)}
                                aria-label="Retirer"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </li>
                ))}
            </ol>

            <div className={styles.footerRow}>
                <button type="button" className={styles.addButton} onClick={addItem}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un élément
                </button>
                <button type="button" className={styles.shuffleButton} onClick={shuffle}>
                    <FontAwesomeIcon icon={faShuffle} aria-hidden="true" /> Mélanger pour l'apprenant
                </button>
            </div>

            {!isShuffled && exercise.config.items.length > 1 && (
                <p className={styles.warning}>
                    L'ordre présenté est identique à l'ordre correct — l'apprenant verrait la bonne
                    réponse déjà en place. Cliquez « Mélanger ».
                </p>
            )}
        </div>
    )
}