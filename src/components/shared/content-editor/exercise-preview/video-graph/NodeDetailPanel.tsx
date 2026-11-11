"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar, faTrash, faPlus, faFlag, faVideo } from "@fortawesome/free-solid-svg-icons"
import SidePanel from "@/components/ui/SidePanel"
import Button from "@/components/ui/Button"
import FileUploader from "@/components/shared/FileUploader"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import type { VideoInteractiveExercise } from "@/types/exercise"
import styles from "./NodeDetailPanel.module.css"

type VideoNode = VideoInteractiveExercise["config"]["nodes"][number]
type DecisionPoint = VideoNode["decisionPoints"][number]

interface NodeDetailPanelProps {
    isOpen: boolean
    onClose: () => void
    node: VideoNode | null
    allNodes: VideoNode[]
    isStartNode: boolean
    onUpdateNode: (patch: Partial<VideoNode>) => void
    onSetAsStart: () => void
    onDeleteNode: () => void
    /** Crée un nouveau nœud vide et retourne son id — pour créer une cible à la volée depuis le sélecteur d'un choix, sans quitter le panneau. */
    onCreateNode: () => string
    referencingNodeLabels: string[]
}

/**
 * Toute l'édition d'un nœud vit ici, pas dans le canevas — vidéo, points
 * de décision, choix (texte, chemin, bon/mauvais). Le graphe (VideoGraphEditor)
 * reste juste une carte cliquable + des flèches.
 */
export default function NodeDetailPanel({
    isOpen,
    onClose,
    node,
    allNodes,
    isStartNode,
    onUpdateNode,
    onSetAsStart,
    onDeleteNode,
    onCreateNode,
    referencingNodeLabels,
}: NodeDetailPanelProps) {
    if (!node) return null

    function updateDecisionPoint(index: number, patch: Partial<DecisionPoint>) {
        const next = [...node!.decisionPoints]
        next[index] = { ...next[index], ...patch }
        onUpdateNode({ decisionPoints: next })
    }

    function addDecisionPoint() {
        onUpdateNode({
            decisionPoints: [
                ...node!.decisionPoints,
                { timestampSeconds: 0, choices: [{ id: crypto.randomUUID(), label: "", nextNodeId: "", isCorrect: false }] },
            ],
        })
    }

    function removeDecisionPoint(index: number) {
        onUpdateNode({ decisionPoints: node!.decisionPoints.filter((_, i) => i !== index) })
    }

    function updateChoice(dpIndex: number, choiceId: string, patch: Partial<DecisionPoint["choices"][number]>) {
        const dp = node!.decisionPoints[dpIndex]
        updateDecisionPoint(dpIndex, {
            choices: dp.choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)),
        })
    }

    function addChoice(dpIndex: number) {
        const dp = node!.decisionPoints[dpIndex]
        updateDecisionPoint(dpIndex, {
            choices: [...dp.choices, { id: crypto.randomUUID(), label: "", nextNodeId: "", isCorrect: false }],
        })
    }

    function removeChoice(dpIndex: number, choiceId: string) {
        const dp = node!.decisionPoints[dpIndex]
        updateDecisionPoint(dpIndex, { choices: dp.choices.filter((choice) => choice.id !== choiceId) })
    }

    function handleCreateNodeForChoice(dpIndex: number, choiceId: string) {
        const newNodeId = onCreateNode()
        updateChoice(dpIndex, choiceId, { nextNodeId: newNodeId })
    }

    const canDelete = referencingNodeLabels.length === 0 && !isStartNode

    return (
        <SidePanel isOpen={isOpen} onClose={onClose} title="Détails du nœud" subtitle={node.id} width={480}>
            <div className={styles.panel}>
                <div className={styles.videoSection}>
                    <span className={styles.sectionLabel}>Vidéo</span>
                    {node.video.url ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={node.video.url} controls className={styles.videoPreview} />
                    ) : (
                        <div className={styles.noVideoPlaceholder}>
                            <FontAwesomeIcon icon={faVideo} aria-hidden="true" />
                            <span>Aucune vidéo</span>
                        </div>
                    )}
                    <FileUploader
                        kinds="video"
                        onUploadComplete={({ url, name }) =>
                            onUpdateNode({ video: { type: "video", url, alt: name } })
                        }
                    >
                        {(open) => (
                            <Button
                                label={node.video.url ? "Remplacer la vidéo" : "Importer une vidéo"}
                                variant="outline"
                                size="sm"
                                onClick={open}
                            />
                        )}
                    </FileUploader>
                </div>

                <div className={styles.actionsRow}>
                    {!isStartNode ? (
                        <Button
                            label="Définir comme nœud de départ"
                            variant="outline"
                            size="sm"
                            onClick={onSetAsStart}
                        />
                    ) : (
                        <span className={styles.startIndicator}>
                            <FontAwesomeIcon icon={faFlag} aria-hidden="true" /> C'est le nœud de départ
                        </span>
                    )}
                </div>

                <div className={styles.decisionPointsSection}>
                    <span className={styles.sectionLabel}>Points de décision</span>

                    {node.decisionPoints.length === 0 && (
                        <p className={styles.emptyNote}>
                            Aucun point de décision — ce nœud est une fin de parcours.
                        </p>
                    )}

                    {node.decisionPoints.map((dp, dpIndex) => (
                        <div key={dpIndex} className={styles.decisionPointCard}>
                            <div className={styles.dpHeader}>
                                <label className={styles.timestampField}>
                                    <span>Déclenché à</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={dp.timestampSeconds}
                                        onChange={(e) =>
                                            updateDecisionPoint(dpIndex, { timestampSeconds: Number(e.target.value) })
                                        }
                                        className={styles.timestampInput}
                                    />
                                    <span>secondes</span>
                                </label>
                                <button
                                    type="button"
                                    className={styles.removeDpButton}
                                    onClick={() => removeDecisionPoint(dpIndex)}
                                    aria-label="Retirer ce point de décision"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>

                            <div className={styles.choicesList}>
                                {dp.choices.map((choice) => (
                                    <div key={choice.id} className={styles.choiceRow}>
                                        <button
                                            type="button"
                                            className={`${styles.correctMarker} ${
                                                choice.isCorrect ? styles.correctMarkerActive : ""
                                            }`}
                                            onClick={() =>
                                                updateChoice(dpIndex, choice.id, { isCorrect: !choice.isCorrect })
                                            }
                                            title="Bon chemin"
                                            aria-label="Marquer comme bon chemin"
                                        >
                                            <FontAwesomeIcon icon={faStar} />
                                        </button>

                                        <div className={styles.choiceFields}>
                                            <input
                                                type="text"
                                                value={choice.label}
                                                onChange={(e) =>
                                                    updateChoice(dpIndex, choice.id, { label: e.target.value })
                                                }
                                                placeholder="Texte du bouton"
                                                className={styles.choiceLabelInput}
                                                maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                                            />
                                            <select
                                                value={choice.nextNodeId}
                                                onChange={(e) => {
                                                    if (e.target.value === "__new__") {
                                                        handleCreateNodeForChoice(dpIndex, choice.id)
                                                    } else {
                                                        updateChoice(dpIndex, choice.id, {
                                                            nextNodeId: e.target.value,
                                                        })
                                                    }
                                                }}
                                                className={styles.choiceTargetSelect}
                                            >
                                                <option value="" disabled>
                                                    Mène à...
                                                </option>
                                                {allNodes.map((targetNode, i) => (
                                                    <option key={targetNode.id} value={targetNode.id}>
                                                        Nœud {i + 1}
                                                        {targetNode.id === node.id ? " (ce nœud)" : ""}
                                                    </option>
                                                ))}
                                                <option value="__new__">+ Créer un nouveau nœud</option>
                                            </select>
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.removeChoiceButton}
                                            onClick={() => removeChoice(dpIndex, choice.id)}
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
                                onClick={() => addChoice(dpIndex)}
                            >
                                <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un choix
                            </button>
                        </div>
                    ))}

                    <Button
                        label="+ Ajouter un point de décision"
                        variant="outline"
                        size="sm"
                        onClick={addDecisionPoint}
                    />
                </div>

                <div className={styles.dangerZone}>
                    {canDelete ? (
                        <Button label="Supprimer ce nœud" variant="ghost" onClick={onDeleteNode} />
                    ) : isStartNode ? (
                        <p className={styles.blockedDeleteNote}>
                            Impossible de supprimer le nœud de départ — définissez-en un autre d'abord.
                        </p>
                    ) : (
                        <p className={styles.blockedDeleteNote}>
                            Ce nœud ne peut pas être supprimé — référencé par : {referencingNodeLabels.join(", ")}.
                            Retirez d'abord ces choix.
                        </p>
                    )}
                </div>
            </div>
        </SidePanel>
    )
}
