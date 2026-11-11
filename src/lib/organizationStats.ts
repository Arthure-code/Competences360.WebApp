import { dedupliquerParApprenant } from "@/lib/formateurDashboard"
import type { GroupStatsRow } from "@/lib/groupStats"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import type { Organization } from "@/types/organization"

export interface OrganizationStatsRow {
    organization: Organization
    groupCount: number
    apprenantCount: number
    averageProgress: number
    lateCount: number
}

/**
 * Nouveau — n'existe nulle part côté Gestionnaire (structurellement
 * impossible, un gestionnaire ne voit jamais qu'une seule org). Seule
 * Admin peut comparer des organisations entre elles, exactement ce que
 * cette page devrait permettre de faire en un coup d'œil.
 *
 * Même esprit que computeFormateurStatsRows (lib/groupStats.ts) — agrège
 * par organisation plutôt que par formateur, déduplique les apprenants
 * (un apprenant dans 3 groupes de la même org ne doit compter qu'une
 * fois dans la moyenne).
 */
export function computeOrganizationStatsRows(
    organizations: Organization[],
    groupRowsByOrg: Map<string, GroupStatsRow[]>,
    summariesByOrg: Map<string, ApprenantSummary[]>
): OrganizationStatsRow[] {
    return organizations.map((organization) => {
        const groupRows = groupRowsByOrg.get(organization.id) ?? []
        const summaries = summariesByOrg.get(organization.id) ?? []
        const apprenants = dedupliquerParApprenant(summaries)
        const apprenantCount = apprenants.length
        const averageProgress =
            apprenantCount > 0
                ? Math.round(apprenants.reduce((sum, s) => sum + s.progressPercent, 0) / apprenantCount)
                : 0
        const lateCount = apprenants.reduce((sum, s) => sum + s.lateModuleTitles.length, 0)

        return {
            organization,
            groupCount: groupRows.length,
            apprenantCount,
            averageProgress,
            lateCount,
        }
    })
}
