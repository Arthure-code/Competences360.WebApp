"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import type { ReponseCourteExercise, ReponseCourteSegment } from "@/types/exercise"
import styles from "./ConfigEditor.module.css"

interface ReponseCourteConfigEditorProps {
    config: ReponseCourteExercise["config"]
    onChange: (config: ReponseCourteExercise["config"]) => void
}

export default function ReponseCourteConfigEditor({ config, onChange }: ReponseCourteConfigEditorProps) {
    function updateSegment(index: number, segment: ReponseCourteSegment) {
        const next = [...config.segments]
        next[index] = segment
        onChange({ segments: next })
    }
    function removeSegment(index: number) {
        onChange({ segments: config.segments.filter((_, i) => i !== index) })
    }
    function addTextSegment() {
        onChange({ segments: [...config.segments, { type: "text", content: "" }] })
    }
    function addBlankSegment() {
        onChange({ segments: [...config.segments, { type: "blank", id: crypto.randomUUID(), acceptedAnswers: [""] }] })
    }

    return (
        <div className={styles.section}>
            <span className={styles.label}>Phrase (texte fixe + trous à remplir)</span>
            <div className={styles.list}>
                {config.segments.map((segment, index) => (
                    <div key={index} className={styles.segmentRow}>
                        {segment.type === "text" ? (
                            <input
                                type="text"
                                value={segment.content}
                                onChange={(e) => updateSegment(index, { type: "text", content: e.target.value })}
                                className={styles.input}
                                placeholder="Texte fixe"
                            />
                        ) : (
                            <input
                                type="text"
                                value={segment.acceptedAnswers.join(", ")}
                                onChange={(e) =>
                                    updateSegment(index, {
                                        type: "blank",
                                        id: segment.id,
                                        acceptedAnswers: e.target.value
                                            .split(",")
                                            .map((a) => a.trim())
                                            .filter(Boolean),
                                    })
                                }
                                className={`${styles.input} ${styles.blankInput}`}
                                placeholder="Réponses acceptées, séparées par des virgules"
                            />
                        )}
                        <button type="button" onClick={() => removeSegment(index)} aria-label="Retirer ce segment">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>
            <div className={styles.row}>
                <button type="button" className={styles.addButton} onClick={addTextSegment}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Texte
                </button>
                <button type="button" className={styles.addButton} onClick={addBlankSegment}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Trou
                </button>
            </div>
        </div>
    )
}
