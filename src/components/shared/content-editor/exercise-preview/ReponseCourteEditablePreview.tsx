"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons"
import type { ReponseCourteExercise, ReponseCourteSegment } from "@/types/exercise"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import rcStyles from "@/components/exercises/ReponseCourteRenderer.module.css"
import styles from "./ReponseCourteEditablePreview.module.css"

type BlankSegment = Extract<ReponseCourteSegment, { type: "blank" }>

interface ReponseCourteEditablePreviewProps {
    exercise: ReponseCourteExercise
    onConfigChange: (config: ReponseCourteExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Un trou = une petite étiquette cliquable dans la phrase, pas un champ
 * texte qui grandit avec le contenu — cliquer dessus ouvre une VRAIE liste
 * de réponses acceptées en dessous (une par ligne, jamais de découpage par
 * virgule). Chaque réponse est son propre champ, donc les espaces
 * fonctionnent normalement pour les réponses à plusieurs mots — comme le
 * ferait n'importe quelle plateforme de texte à trous.
 */
export default function ReponseCourteEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: ReponseCourteEditablePreviewProps) {
    const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null)

    function updateSegment(index: number, segment: ReponseCourteSegment) {
        const next = [...exercise.config.segments]
        next[index] = segment
        onConfigChange({ segments: next })
    }
    function removeSegment(index: number) {
        const segment = exercise.config.segments[index]
        if (segment.type === "blank" && segment.id === selectedBlankId) setSelectedBlankId(null)
        onConfigChange({ segments: exercise.config.segments.filter((_, i) => i !== index) })
    }
    function addTextSegment() {
        onConfigChange({ segments: [...exercise.config.segments, { type: "text", content: "texte" }] })
    }
    function addBlankSegment() {
        const newBlank: BlankSegment = { type: "blank", id: crypto.randomUUID(), acceptedAnswers: [""] }
        onConfigChange({ segments: [...exercise.config.segments, newBlank] })
        setSelectedBlankId(newBlank.id)
    }

    function updateAnswer(blankIndex: number, answerIndex: number, value: string) {
        const segment = exercise.config.segments[blankIndex] as BlankSegment
        const nextAnswers = [...segment.acceptedAnswers]
        nextAnswers[answerIndex] = value
        updateSegment(blankIndex, { ...segment, acceptedAnswers: nextAnswers })
    }
    function addAnswer(blankIndex: number) {
        const segment = exercise.config.segments[blankIndex] as BlankSegment
        updateSegment(blankIndex, { ...segment, acceptedAnswers: [...segment.acceptedAnswers, ""] })
    }
    function removeAnswer(blankIndex: number, answerIndex: number) {
        const segment = exercise.config.segments[blankIndex] as BlankSegment
        if (segment.acceptedAnswers.length <= 1) return // toujours au moins une réponse, même vide
        updateSegment(blankIndex, {
            ...segment,
            acceptedAnswers: segment.acceptedAnswers.filter((_, i) => i !== answerIndex),
        })
    }

    const selectedBlankIndex = exercise.config.segments.findIndex(
        (segment) => segment.type === "blank" && segment.id === selectedBlankId
    )
    const selectedBlank =
        selectedBlankIndex !== -1 ? (exercise.config.segments[selectedBlankIndex] as BlankSegment) : null

    return (
        <div className={rcStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Réponse courte</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Consigne (facultative si la phrase à trous suffit)"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={rcStyles.sentence}>
                {exercise.config.segments.map((segment, index) => (
                    <span key={index} className={styles.segmentWrapper}>
                        {segment.type === "text" ? (
                            <input
                                type="text"
                                value={segment.content}
                                onChange={(e) => updateSegment(index, { type: "text", content: e.target.value })}
                                className={`${rcStyles.text} ${styles.textInput}`}
                                style={{ width: `${Math.max(segment.content.length, 3)}ch` }}
                                maxLength={CONTENT_TEXT_LIMITS.reponseCourteSegmentText}
                            />
                        ) : (
                            <button
                                type="button"
                                className={`${rcStyles.blank} ${styles.blankToken} ${
                                    segment.id === selectedBlankId ? styles.blankTokenActive : ""
                                }`}
                                onClick={() => setSelectedBlankId(segment.id === selectedBlankId ? null : segment.id)}
                            >
                                <span className={styles.blankTokenLabel}>
                                    {segment.acceptedAnswers[0]?.trim() || "Cliquer pour définir..."}
                                </span>
                                {segment.acceptedAnswers.filter((a) => a.trim()).length > 1 && (
                                    <span className={styles.blankTokenBadge}>
                                        +{segment.acceptedAnswers.filter((a) => a.trim()).length - 1}
                                    </span>
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            className={styles.removeSegmentButton}
                            onClick={() => removeSegment(index)}
                            aria-label="Retirer ce segment"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </span>
                ))}
            </div>

            <div className={styles.addRow}>
                <button type="button" className={styles.addButton} onClick={addTextSegment}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Texte
                </button>
                <button type="button" className={styles.addButton} onClick={addBlankSegment}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Trou
                </button>
            </div>

            {selectedBlank && (
                <div className={styles.answerBank}>
                    <div className={styles.answerBankHeader}>
                        <span className={styles.answerBankLabel}>
                            Réponses acceptées pour ce trou — toutes sont valides à la correction
                        </span>
                        <button
                            type="button"
                            className={styles.closeBankButton}
                            onClick={() => setSelectedBlankId(null)}
                            aria-label="Fermer la banque de réponses"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                    <div className={styles.answerList}>
                        {selectedBlank.acceptedAnswers.map((answer, answerIndex) => (
                            <div key={answerIndex} className={styles.answerRow}>
                                <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => updateAnswer(selectedBlankIndex, answerIndex, e.target.value)}
                                    className={styles.answerInput}
                                    placeholder="Une réponse acceptée"
                                    maxLength={CONTENT_TEXT_LIMITS.reponseCourteBlankAnswer}
                                    autoFocus={answerIndex === selectedBlank.acceptedAnswers.length - 1 && !answer}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeAnswer(selectedBlankIndex, answerIndex)}
                                    disabled={selectedBlank.acceptedAnswers.length <= 1}
                                    aria-label="Retirer cette réponse"
                                    className={styles.removeAnswerButton}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" className={styles.addButton} onClick={() => addAnswer(selectedBlankIndex)}>
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un synonyme accepté
                    </button>
                </div>
            )}
        </div>
    )
}