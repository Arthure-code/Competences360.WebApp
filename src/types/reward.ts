import type { Difficulty } from "./module"

export type RewardType = "badge" | "certificate" | "moment-fort"

interface RewardBase {
    id: string
    /** Date ISO d'obtention */
    earnedAt: string
}

/** Niveau complété — les libellés (titre, catégorie) se résolvent par lookup, jamais dupliqués ici (voir lib/rewards.ts) */
export interface BadgeReward extends RewardBase {
    type: "badge"
    niveauId: string
    moduleId: string
    categoryId: string
    difficulty: Difficulty
    score: number
    maxScore: number
}

/** Module complété en entier */
export interface CertificateReward extends RewardBase {
    type: "certificate"
    moduleId: string
    niveauxCompletedCount: number
    averageScorePercent: number
}

/** Référence une entrée de constants/momentsForts.ts — jamais de label/description dupliqués ici */
export interface MomentFortReward extends RewardBase {
    type: "moment-fort"
    momentKey: string
}

export type Reward = BadgeReward | CertificateReward | MomentFortReward
