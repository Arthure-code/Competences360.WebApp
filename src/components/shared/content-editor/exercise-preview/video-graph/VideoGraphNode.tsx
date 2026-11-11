import { Handle, Position, type NodeProps } from "@xyflow/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faFlag } from "@fortawesome/free-solid-svg-icons"
import styles from "./VideoGraphNode.module.css"

export interface VideoGraphNodeData {
    label: string
    isStart: boolean
    hasVideo: boolean
    videoUrl?: string
    decisionPointCount: number
    [key: string]: unknown
}

/**
 * Carte compacte, volontairement sans formulaire — cliquer un nœud ouvre
 * le panneau de détails (NodeDetailPanel), le canevas reste juste lisible
 * d'un coup d'œil : quelle vidéo, combien de points de décision, lequel
 * est le départ.
 */
export default function VideoGraphNode({ data, selected }: NodeProps) {
    const nodeData = data as VideoGraphNodeData

    return (
        <div className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}>
            <Handle type="target" position={Position.Left} className={styles.handle} />

            {nodeData.isStart && (
                <span className={styles.startBadge}>
                    <FontAwesomeIcon icon={faFlag} aria-hidden="true" /> Départ
                </span>
            )}

            <div className={styles.thumbnail}>
                {nodeData.hasVideo ? (
                    <>
                        <video src={nodeData.videoUrl} className={styles.thumbnailVideo} muted />
                        <span className={styles.playOverlay}>
                            <FontAwesomeIcon icon={faPlay} />
                        </span>
                    </>
                ) : (
                    <span className={styles.noVideo}>Pas de vidéo</span>
                )}
            </div>

            <span className={styles.nodeLabel}>{nodeData.label}</span>
            <span className={styles.nodeMeta}>
                {nodeData.decisionPointCount > 0
                    ? `${nodeData.decisionPointCount} point${nodeData.decisionPointCount > 1 ? "s" : ""} de décision`
                    : "Fin de parcours"}
            </span>

            <Handle type="source" position={Position.Right} className={styles.handle} />
        </div>
    )
}
