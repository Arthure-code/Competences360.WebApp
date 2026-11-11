import type { Module, Niveau } from "@/types/module"
import type { Reward, BadgeReward, CertificateReward, MomentFortReward } from "@/types/reward"
import { getMomentFortDefinition } from "@/constants/momentsFortsDefinitions"
import { DIFFICULTY_LABELS } from "@/constants/difficulty"

export function getBadges(rewards: Reward[]): BadgeReward[] {
    return rewards.filter((reward): reward is BadgeReward => reward.type === "badge")
}

export function getCertificates(rewards: Reward[]): CertificateReward[] {
    return rewards.filter((reward): reward is CertificateReward => reward.type === "certificate")
}

export function getMomentsForts(rewards: Reward[]): MomentFortReward[] {
    return rewards.filter((reward): reward is MomentFortReward => reward.type === "moment-fort")
}

function findNiveau(modules: Module[], niveauId: string): { niveau: Niveau; module: Module } | undefined {
    for (const module of modules) {
        const niveau = module.niveaux.find((n) => n.id === niveauId)
        if (niveau) return { niveau, module }
    }
    return undefined
}

export interface BadgeDisplay {
    title: string
    subtitle: string
    categoryId: string
    score: number
    maxScore: number
    /**
     * Optionnel par prudence (pas garanti sur une entrée déjà complétée
     * avant l'ajout de apprenantModuleProgress.mock.ts) — mais rempli
     * pour toute nouvelle complétion, via firstCompletedAt. BadgeCard
     * masque la ligne de date seulement quand vraiment absent.
     */
    earnedAt?: string
}

/**
 * Résout un BadgeReward en texte affichable — null si le niveau référencé
 * n'existe plus dans `modules` (contenu supprimé), pour ne pas planter le
 * rendu sur une récompense orpheline.
 */
export function getBadgeDisplay(badge: BadgeReward, modules: Module[]): BadgeDisplay | null {
    const found = findNiveau(modules, badge.niveauId)
    if (!found) return null

    return {
        title: `Niveau ${found.niveau.index} — ${found.niveau.title}`,
        subtitle: found.module.title,
        categoryId: badge.categoryId,
        score: badge.score,
        maxScore: badge.maxScore,
        earnedAt: badge.earnedAt,
    }
}

export interface CertificateDisplay {
    title: string
    categoryId: string
    niveauxCompletedCount: number
    averageScorePercent: number
    /** Optionnel par prudence, voir le commentaire équivalent sur BadgeDisplay.earnedAt. */
    earnedAt?: string
}

export function getCertificateDisplay(certificate: CertificateReward, modules: Module[]): CertificateDisplay | null {
    const module = modules.find((m) => m.id === certificate.moduleId)
    if (!module) return null

    return {
        title: module.title,
        categoryId: module.categoryId,
        niveauxCompletedCount: certificate.niveauxCompletedCount,
        averageScorePercent: certificate.averageScorePercent,
        earnedAt: certificate.earnedAt,
    }
}

export interface MomentFortDisplay {
    label: string
    description: string
    icon: string
    earnedAt: string
}

export function getMomentFortDisplay(moment: MomentFortReward): MomentFortDisplay {
    const definition = getMomentFortDefinition(moment.momentKey)
    return {
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        earnedAt: moment.earnedAt,
    }
}

/**
 * Symétrique de getMomentFortDisplay, mais pour ApprenantMomentFortEntry
 * (voir types/apprenantMomentFort.ts, apprenantModuleProgress.actions.ts)
 * plutôt que l'ancien MomentFortReward — les vrais moments forts détectés
 * par upsertNiveauProgress, pas ceux du mock statique rewards.mock.ts.
 */
export function getMomentFortDisplayFromEntry(entry: {
    momentKey: string
    earnedAt: string
}): MomentFortDisplay {
    const definition = getMomentFortDefinition(entry.momentKey)
    return {
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        earnedAt: entry.earnedAt,
    }
}

/** "Novice Littératie" etc. — réutilisé par lib/notices.ts pour l'annonce ET par Mes réussites pour la carte du badge. */
export function formatBadgeDifficultyLabel(difficulty: BadgeReward["difficulty"]): string {
    return DIFFICULTY_LABELS[difficulty]
}