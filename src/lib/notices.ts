import type { Module } from "@/types/module"
import type { Notice } from "@/types/notice"
import type { BadgeReward, CertificateReward, MomentFortReward } from "@/types/reward"
import { getBadgeDisplay, getCertificateDisplay, getMomentFortDisplay, formatBadgeDifficultyLabel } from "./rewards"
import { routes } from "@/constants/routes"

/**
 * Toutes les notices ci-dessous se construisent à partir du même Reward
 * que celui persisté dans _mocks/rewards.mock.ts (et plus tard la vraie
 * table de récompenses) — le toast affiché au déblocage et la carte dans
 * Mes réussites parlent donc toujours du même texte, jamais deux formulations
 * séparées à maintenir.
 */

/** null si le niveau référencé n'existe plus dans `modules` (voir getBadgeDisplay) */
export function getBadgeUnlockedNotice(badge: BadgeReward, modules: Module[]): Notice | null {
    const display = getBadgeDisplay(badge, modules)
    if (!display) return null

    return {
        variant: "success",
        title: "Niveau complété",
        message: `${formatBadgeDifficultyLabel(badge.difficulty)} — ${display.title}. Ce badge est maintenant disponible dans Mes réussites.`,
        icon: "faMedal",
        actionHref: routes.apprenant.reussites,
        actionLabel: "Voir mes réussites",
        dismissible: true,
    }
}

/** null si le module référencé n'existe plus dans `modules` (voir getCertificateDisplay) */
export function getCertificateUnlockedNotice(certificate: CertificateReward, modules: Module[]): Notice | null {
    const display = getCertificateDisplay(certificate, modules)
    if (!display) return null

    return {
        variant: "success",
        title: "Certificat obtenu",
        message: `${display.title} — ce certificat est maintenant disponible dans Mes réussites.`,
        icon: "faCertificate",
        actionHref: routes.apprenant.reussites,
        actionLabel: "Voir mes réussites",
        dismissible: true,
    }
}

export function getMomentFortUnlockedNotice(moment: MomentFortReward): Notice {
    const display = getMomentFortDisplay(moment)
    return {
        variant: "success",
        title: "Moment fort",
        message: display.description || display.label,
        icon: display.icon,
        actionHref: routes.apprenant.reussites,
        actionLabel: "Voir mes réussites",
        dismissible: true,
    }
}

/**
 * Alerte "modules en retard" — page Mon parcours. Variant warning plutôt
 * que success/error : c'est une alerte à traiter, pas une célébration ni
 * une erreur bloquante. Pas liée au système de récompenses.
 */
export function getLateModulesNotice(lateCount: number): Notice {
    return {
        variant: "warning",
        title: "Modules en retard",
        message: `Vous avez ${lateCount} module${lateCount > 1 ? "s" : ""} ayant dépassé ${lateCount > 1 ? "leur" : "sa"} date limite.`,
        actionHref: routes.apprenant.modules.filterByStatus("late"),
        actionLabel: "Rattraper maintenant",
        dismissible: true,
    }
}