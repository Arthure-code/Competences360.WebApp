import type { ApprenantSummary } from "@/types/apprenantSummary"
import type { Group } from "@/types/group"

/**
 * Une fiche par personne, là où l'API en rend une par adhésion.
 *
 * Un apprenant membre de trois groupes arrive en trois exemplaires, portant
 * le même avancement, les mêmes retards et la même dernière activité — seul
 * le groupe change. Compter ces fiches compterait les adhésions, et une
 * moyenne les pondérerait par le nombre de groupes de chacun.
 *
 * Les écrans qui parlent de PERSONNES passent par ici. Ceux qui comparent des
 * GROUPES gardent les fiches telles quelles : une même personne compte alors
 * légitimement dans chacun de ses groupes.
 */
export function dedupliquerParApprenant(summaries: ApprenantSummary[]): ApprenantSummary[] {
    const parUtilisateur = new Map<string, ApprenantSummary>()

    for (const summary of summaries) {
        if (!parUtilisateur.has(summary.userId)) {
            parUtilisateur.set(summary.userId, summary)
        }
    }

    return Array.from(parUtilisateur.values())
}

export interface FormateurDashboardStats {
    groupCount: number
    apprenantCount: number
    averageProgressPercent: number
}

export function computeFormateurStats(groups: Group[], summaries: ApprenantSummary[]): FormateurDashboardStats {
    const apprenants = dedupliquerParApprenant(summaries)
    const apprenantCount = apprenants.length
    const averageProgressPercent =
        apprenantCount > 0
            ? Math.round(apprenants.reduce((sum, s) => sum + s.progressPercent, 0) / apprenantCount)
            : 0
    return { groupCount: groups.length, apprenantCount, averageProgressPercent }
}

export interface LateAlertEntry {
    apprenantUserId: string
    apprenantFullName: string
    moduleTitle: string
}

/** Aplati "qui est en retard sur quoi" — une entrée par (apprenant, module en retard), pas juste un compteur agrégé. */
export function getLateAlertEntries(summaries: ApprenantSummary[]): LateAlertEntry[] {
    return dedupliquerParApprenant(summaries).flatMap((summary) =>
        summary.lateModuleTitles.map((moduleTitle) => ({
            apprenantUserId: summary.userId,
            apprenantFullName: summary.fullName,
            moduleTitle,
        }))
    )
}

// Baisse de score qui justifie une alerte. Ce seuil reste ici : aucun
// traitement serveur ne s'en sert, il ne sert qu'à teinter cet affichage.
const SCORE_DECLINE_THRESHOLD = -10

/**
 * Apprenants sur lesquels attirer l'attention : score en baisse, inactifs
 * au-delà du délai, ou en retard sur au moins un module.
 *
 * Le délai d'inactivité est un paramètre, pas une constante. Il est défini
 * dans la configuration de la plateforme (`GET /api/configuration`, section
 * `Progression:JoursInactivite`) et doit valoir la même chose partout où il
 * est appliqué ou affiché — l'écrire ici en donnerait une seconde version,
 * qui divergerait le jour où l'autre change.
 */
export function getApprenantsNeedingAttention(
    summaries: ApprenantSummary[],
    joursInactivite: number,
): ApprenantSummary[] {
    const now = Date.now()
    return dedupliquerParApprenant(summaries).filter((summary) => {
        const daysSinceActive = (now - new Date(summary.lastActiveAt).getTime()) / 86_400_000
        const isInactive = daysSinceActive > joursInactivite
        const isDeclining = summary.scoreTrend !== null && summary.scoreTrend <= SCORE_DECLINE_THRESHOLD
        const isLate = summary.lateModuleTitles.length > 0
        return isInactive || isDeclining || isLate
    })
}