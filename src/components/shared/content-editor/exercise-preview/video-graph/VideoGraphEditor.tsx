"use client"

import { useEffect, useState } from "react"
import { ReactFlow, ReactFlowProvider, Controls, Background, type Node, type Edge } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import VideoGraphNode, { type VideoGraphNodeData } from "./VideoGraphNode"
import NodeDetailPanel from "./NodeDetailPanel"
import { computeGraphLayout } from "@/lib/videoGraphLayout"
import type { VideoInteractiveExercise } from "@/types/exercise"
import styles from "./VideoGraphEditor.module.css"

interface VideoGraphEditorProps {
    exercise: VideoInteractiveExercise
    onConfigChange: (config: VideoInteractiveExercise["config"]) => void
    onClose: () => void
}

type VideoNode = VideoInteractiveExercise["config"]["nodes"][number]

const nodeTypes = { videoNode: VideoGraphNode }

/**
 * Le canevas reste volontairement simple : cartes + flèches, positionnement
 * automatique (lib/videoGraphLayout.ts), pas de drag manuel (nodesDraggable
 * désactivé) — pour que le graphe reste toujours lisible, jamais un
 * agencement bricolé à la main qui devient confus avec le temps. Toute
 * l'édition réelle vit dans NodeDetailPanel, ouvert au clic sur un nœud.
 */
export default function VideoGraphEditor({ exercise, onConfigChange, onClose }: VideoGraphEditorProps) {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

    // Indicateur local, purement rassurant — la vraie sauvegarde (débattue) vit dans ContentEditor, invisible derrière cet overlay plein écran.
    useEffect(() => {
        const timeout = setTimeout(() => setLastSavedAt(new Date()), 500)
        return () => clearTimeout(timeout)
    }, [exercise.config])

    const positions = computeGraphLayout(exercise.config)

    const flowNodes: Node[] = exercise.config.nodes.map((node, index) => {
        const position = positions.get(node.id) ?? { x: 0, y: index * 180 }
        const data: VideoGraphNodeData = {
            label: `Nœud ${index + 1}`,
            isStart: node.id === exercise.config.startNodeId,
            hasVideo: Boolean(node.video.url),
            videoUrl: node.video.url,
            decisionPointCount: node.decisionPoints.length,
        }
        return {
            id: node.id,
            type: "videoNode",
            position,
            data,
            selected: node.id === selectedNodeId,
            draggable: false,
        }
    })

    const flowEdges: Edge[] = []
    exercise.config.nodes.forEach((node) => {
        node.decisionPoints.forEach((dp, dpIndex) => {
            dp.choices.forEach((choice) => {
                if (!choice.nextNodeId) return
                flowEdges.push({
                    id: `${node.id}-${dpIndex}-${choice.id}`,
                    source: node.id,
                    target: choice.nextNodeId,
                    label: choice.label || "Sans texte",
                    style: { stroke: choice.isCorrect ? "var(--color-success)" : "var(--color-text-disabled)" },
                    labelStyle: {
                        fill: choice.isCorrect ? "var(--color-success)" : "var(--color-text-muted)",
                        fontWeight: 600,
                        fontSize: 12,
                    },
                    animated: choice.isCorrect,
                })
            })
        })
    })

    const selectedNode = exercise.config.nodes.find((n) => n.id === selectedNodeId) ?? null

    function addNode(): string {
        const newNodeId = crypto.randomUUID()
        const newNode: VideoNode = { id: newNodeId, video: { type: "video", url: "" }, decisionPoints: [] }
        onConfigChange({ ...exercise.config, nodes: [...exercise.config.nodes, newNode] })
        return newNodeId
    }

    function updateNode(nodeId: string, patch: Partial<VideoNode>) {
        onConfigChange({
            ...exercise.config,
            nodes: exercise.config.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
        })
    }

    function setAsStart(nodeId: string) {
        onConfigChange({ ...exercise.config, startNodeId: nodeId })
    }

    function deleteNode(nodeId: string) {
        onConfigChange({ ...exercise.config, nodes: exercise.config.nodes.filter((n) => n.id !== nodeId) })
        setSelectedNodeId(null)
    }

    function getReferencingLabels(nodeId: string): string[] {
        const labels: string[] = []
        exercise.config.nodes.forEach((n, index) => {
            const references = n.decisionPoints.some((dp) => dp.choices.some((c) => c.nextNodeId === nodeId))
            if (references) labels.push(`Nœud ${index + 1}`)
        })
        return labels
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.header}>
                <span className={styles.title}>Graphe du parcours vidéo</span>
                <div className={styles.headerActions}>
                    <span className={styles.saveIndicator}>
                        {lastSavedAt &&
                            `Enregistré à ${lastSavedAt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                    <Button label="+ Ajouter un nœud" variant="outline" size="sm" onClick={() => addNode()} />
                    <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            </div>

            <div className={styles.canvas}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={flowNodes}
                        edges={flowEdges}
                        nodeTypes={nodeTypes}
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        onPaneClick={() => setSelectedNodeId(null)}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        fitView
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background gap={24} />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </ReactFlowProvider>

                {exercise.config.nodes.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Aucun nœud pour l'instant.</p>
                        <Button label="+ Ajouter le premier nœud" onClick={() => addNode()} />
                    </div>
                )}
            </div>

            <NodeDetailPanel
                isOpen={selectedNode !== null}
                onClose={() => setSelectedNodeId(null)}
                node={selectedNode}
                allNodes={exercise.config.nodes}
                isStartNode={selectedNode?.id === exercise.config.startNodeId}
                onUpdateNode={(patch) => selectedNode && updateNode(selectedNode.id, patch)}
                onSetAsStart={() => selectedNode && setAsStart(selectedNode.id)}
                onDeleteNode={() => selectedNode && deleteNode(selectedNode.id)}
                onCreateNode={addNode}
                referencingNodeLabels={selectedNode ? getReferencingLabels(selectedNode.id) : []}
            />
        </div>
    )
}