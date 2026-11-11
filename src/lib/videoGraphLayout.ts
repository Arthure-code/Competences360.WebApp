import type { VideoInteractiveExercise } from "@/types/exercise"

export interface GraphNodePosition {
    x: number
    y: number
}

const COLUMN_WIDTH = 300
const ROW_HEIGHT = 180

/**
 * Positionnement automatique en colonnes par profondeur (BFS depuis
 * startNodeId) — jamais de chevauchement, jamais besoin de faire glisser
 * un nœud à la main pour que le graphe reste lisible. Chaque colonne =
 * une "distance" depuis le départ ; les nœuds d'une même colonne
 * s'empilent verticalement. Un nœud jamais atteint depuis le départ
 * (orphelin) atterrit dans sa propre colonne, à part, plutôt que de se
 * mélanger avec les nœuds accessibles.
 */
export function computeGraphLayout(config: VideoInteractiveExercise["config"]): Map<string, GraphNodePosition> {
    const positions = new Map<string, GraphNodePosition>()
    const depthByNode = new Map<string, number>()
    const nodesById = new Map(config.nodes.map((node) => [node.id, node]))

    if (nodesById.has(config.startNodeId)) {
        const visited = new Set<string>([config.startNodeId])
        const queue: string[] = [config.startNodeId]
        depthByNode.set(config.startNodeId, 0)

        while (queue.length > 0) {
            const currentId = queue.shift() as string
            const currentDepth = depthByNode.get(currentId) ?? 0
            const node = nodesById.get(currentId)
            if (!node) continue

            for (const decisionPoint of node.decisionPoints) {
                for (const choice of decisionPoint.choices) {
                    if (visited.has(choice.nextNodeId)) continue
                    visited.add(choice.nextNodeId)
                    depthByNode.set(choice.nextNodeId, currentDepth + 1)
                    queue.push(choice.nextNodeId)
                }
            }
        }
    }

    const maxKnownDepth = Math.max(0, ...Array.from(depthByNode.values()))
    for (const node of config.nodes) {
        if (!depthByNode.has(node.id)) depthByNode.set(node.id, maxKnownDepth + 1)
    }

    const countByDepth = new Map<number, number>()
    for (const node of config.nodes) {
        const depth = depthByNode.get(node.id) ?? 0
        const rowIndex = countByDepth.get(depth) ?? 0
        countByDepth.set(depth, rowIndex + 1)
        positions.set(node.id, { x: depth * COLUMN_WIDTH, y: rowIndex * ROW_HEIGHT })
    }

    return positions
}
