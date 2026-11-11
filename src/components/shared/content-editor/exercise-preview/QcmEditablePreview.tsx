"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons"
import type { QcmExercise } from "@/types/exercise"
import { MAX_QCM_CHOICES, CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import qcmStyles from "@/components/exercises/QcmRenderer.module.css"
import styles from "./QcmEditablePreview.module.css"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

interface QcmEditablePreviewProps {
    exercise: QcmExercise
    onConfigChange: (config: QcmExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Réutilise les classes CSS du VRAI QcmRenderer (qcmStyles.wrapper/choices/
 * choice/letter/label) pour un rendu visuellement identique à ce que
 * l'apprenant verra — seule l'interaction change (cliquer = éditer le
 * texte, pas répondre). L'étoile marque la bonne réponse, une seule à la
 * fois (radio implicite via config.correctChoiceId).
 */
export default function QcmEditablePreview({ exercise, onConfigChange, onPromptChange }: QcmEditablePreviewProps) {
    const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null)

    function updateChoiceLabel(choiceId: string, label: string) {
        onConfigChange({
            ...exercise.config,
            choices: exercise.config.choices.map((choice) => (choice.id === choiceId ? { ...choice, label } : choice)),
        })
    }

    function addChoice() {
        const newChoice = { id: crypto.randomUUID(), label: "" }
        onConfigChange({ ...exercise.config, choices: [...exercise.config.choices, newChoice] })
        setEditingChoiceId(newChoice.id)
    }

    function removeChoice(choiceId: string) {
        onConfigChange({
            ...exercise.config,
            choices: exercise.config.choices.filter((choice) => choice.id !== choiceId),
            correctChoiceId: exercise.config.correctChoiceId === choiceId ? "" : exercise.config.correctChoiceId,
        })
    }

    function markCorrect(choiceId: string) {
        onConfigChange({ ...exercise.config, correctChoiceId: choiceId })
    }

    return (
        <div className={qcmStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Choix de réponse</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={qcmStyles.choices}>
                {exercise.config.choices.map((choice, index) => (
                    <div key={choice.id} className={styles.choiceEditRow}>
                        <button
                            type="button"
                            className={`${styles.correctMarker} ${
                                exercise.config.correctChoiceId === choice.id ? styles.correctMarkerActive : ""
                            }`}
                            onClick={() => markCorrect(choice.id)}
                            aria-label={`Marquer « ${choice.label || "cette option"} » comme la bonne réponse`}
                            title="Bonne réponse"
                        >
                            <FontAwesomeIcon icon={faStar} />
                        </button>

                        <div className={`${qcmStyles.choice} ${styles.choiceEditable}`} onClick={() => setEditingChoiceId(choice.id)}>
                            <span className={qcmStyles.letter}>{LETTERS[index] ?? index + 1}</span>
                            {editingChoiceId === choice.id ? (
                                <input
                                    type="text"
                                    autoFocus
                                    value={choice.label}
                                    onChange={(e) => updateChoiceLabel(choice.id, e.target.value)}
                                    onBlur={() => setEditingChoiceId(null)}
                                    onKeyDown={(e) => e.key === "Enter" && setEditingChoiceId(null)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.choiceInput}
                                />
                            ) : (
                                <span className={qcmStyles.label}>{choice.label || "Cliquer pour écrire..."}</span>
                            )}
                        </div>

                        <button
                            type="button"
                            className={styles.removeChoiceButton}
                            onClick={() => removeChoice(choice.id)}
                            aria-label="Retirer ce choix"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className={styles.addChoiceButton}
                onClick={addChoice}
                disabled={exercise.config.choices.length >= MAX_QCM_CHOICES}
            >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                Ajouter un choix ({exercise.config.choices.length}/{MAX_QCM_CHOICES})
            </button>
        </div>
    )
}