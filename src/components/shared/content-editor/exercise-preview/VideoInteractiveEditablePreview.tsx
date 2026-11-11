"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiagramProject } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import VideoGraphEditor from "./video-graph/VideoGraphEditor"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import type { VideoInteractiveExercise } from "@/types/exercise"
import styles from "./VideoInteractiveEditablePreview.module.css"

interface VideoInteractiveEditablePreviewProps {
    exercise: VideoInteractiveExercise
    onConfigChange: (config: VideoInteractiveExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

/**
 * Pas d'édition inline ici (contrairement aux autres types) — un graphe de
 * nœuds vidéo a besoin de tout l'espace disponible, pas d'une carte
 * dans le panneau. Résumé rapide + bouton "Modifier le graphe" qui
 * ouvre VideoGraphEditor en plein écran, exactement l'esprit de "panneau
 * d'infos + preview côte à côte, un bouton pour basculer vers l'édition"
 * déjà établi pour les autres types.
 */
export default function VideoInteractiveEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: VideoInteractiveEditablePreviewProps) {
    const [isGraphOpen, setGraphOpen] = useState(false)

    const nodeCount = exercise.config.nodes.length
    const decisionPointCount = exercise.config.nodes.reduce((sum, n) => sum + n.decisionPoints.length, 0)
    const startNode = exercise.config.nodes.find((n) => n.id === exercise.config.startNodeId)

    return (
        <div className={styles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Vidéo interactive</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            <div className={styles.summaryCard}>
                {startNode?.video.url ? (
                    <video src={startNode.video.url} className={styles.startThumbnail} muted />
                ) : (
                    <div className={styles.noThumbnail}>
                        <FontAwesomeIcon icon={faDiagramProject} aria-hidden="true" />
                    </div>
                )}
                <div className={styles.summaryText}>
                    <span className={styles.summaryStat}>
                        {nodeCount} nœud{nodeCount > 1 ? "s" : ""} — {decisionPointCount} point
                        {decisionPointCount > 1 ? "s" : ""} de décision
                    </span>
                    {nodeCount === 0 && <span className={styles.summaryHint}>Commencez par créer le graphe</span>}
                </div>
                <Button label="Modifier le graphe" onClick={() => setGraphOpen(true)} />
            </div>

            {isGraphOpen && (
                <VideoGraphEditor
                    exercise={exercise}
                    onConfigChange={onConfigChange}
                    onClose={() => setGraphOpen(false)}
                />
            )}
        </div>
    )
}
