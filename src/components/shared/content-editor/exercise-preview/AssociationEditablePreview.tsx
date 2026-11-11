"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import type { AssociationExercise } from "@/types/exercise"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import associationStyles from "@/components/exercises/AssociationRenderer.module.css"
import styles from "./AssociationEditablePreview.module.css"

interface AssociationEditablePreviewProps {
    exercise: AssociationExercise
    onConfigChange: (config: AssociationExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Pas de vrai glisser-déposer à l'édition — inutile ici, contrairement au
 * mode Test (qui rejoue le vrai AssociationRenderer avec dnd-kit). Chaque
 * cible a directement un sélecteur pour choisir sa bonne option, pas
 * besoin de mimer le geste de l'apprenant pour définir le contenu.
 */
export default function AssociationEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: AssociationEditablePreviewProps) {
    function updateTargetLabel(targetId: string, label: string) {
        onConfigChange({
            ...exercise.config,
            targets: exercise.config.targets.map((target) =>
                target.id === targetId ? { ...target, label } : target
            ),
        })
    }
    function addTarget() {
        onConfigChange({ ...exercise.config, targets: [...exercise.config.targets, { id: crypto.randomUUID(), label: "" }] })
    }
    function removeTarget(targetId: string) {
        const nextMap = { ...exercise.config.correctMap }
        delete nextMap[targetId]
        onConfigChange({
            ...exercise.config,
            targets: exercise.config.targets.filter((target) => target.id !== targetId),
            correctMap: nextMap,
        })
    }
    function setCorrectOption(targetId: string, optionId: string) {
        onConfigChange({ ...exercise.config, correctMap: { ...exercise.config.correctMap, [targetId]: optionId } })
    }

    function updateOptionLabel(optionId: string, label: string) {
        onConfigChange({
            ...exercise.config,
            options: exercise.config.options.map((option) =>
                option.id === optionId ? { ...option, label } : option
            ),
        })
    }
    function addOption() {
        onConfigChange({ ...exercise.config, options: [...exercise.config.options, { id: crypto.randomUUID(), label: "" }] })
    }
    function removeOption(optionId: string) {
        const nextMap = Object.fromEntries(
            Object.entries(exercise.config.correctMap).filter(([, mappedOptionId]) => mappedOptionId !== optionId)
        )
        onConfigChange({
            ...exercise.config,
            options: exercise.config.options.filter((option) => option.id !== optionId),
            correctMap: nextMap,
        })
    }

    return (
        <div className={associationStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Association</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={associationStyles.board}>
                <div className={associationStyles.targets}>
                    {exercise.config.targets.map((target) => (
                        <div key={target.id} className={styles.targetEditRow}>
                            <input
                                type="text"
                                value={target.label}
                                onChange={(e) => updateTargetLabel(target.id, e.target.value)}
                                className={styles.targetLabelInput}
                                placeholder="Cible..."
                                maxLength={CONTENT_TEXT_LIMITS.associationLabel}
                            />
                            <select
                                value={exercise.config.correctMap[target.id] ?? ""}
                                onChange={(e) => setCorrectOption(target.id, e.target.value)}
                                className={styles.targetSelect}
                            >
                                <option value="" disabled>
                                    Bonne option
                                </option>
                                {exercise.config.options.map((option, i) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label || `Option ${i + 1}`}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeTarget(target.id)}
                                aria-label="Retirer cette cible"
                                className={styles.removeButton}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={addTarget}>
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter une cible
                    </button>
                </div>

                <div className={associationStyles.bank}>
                    {exercise.config.options.map((option) => (
                        <div key={option.id} className={styles.optionEditChip}>
                            <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOptionLabel(option.id, e.target.value)}
                                className={styles.optionInput}
                                placeholder="Option..."
                                maxLength={CONTENT_TEXT_LIMITS.associationLabel}
                            />
                            <button
                                type="button"
                                onClick={() => removeOption(option.id)}
                                aria-label="Retirer cette option"
                                className={styles.removeButton}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={addOption}>
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter une option
                    </button>
                </div>
            </div>
        </div>
    )
}
