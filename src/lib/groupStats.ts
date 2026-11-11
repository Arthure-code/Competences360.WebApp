import { getGroupMemberCounts } from "@/_mocks/groups.mock"
import { getInvitationsForGroups } from "@/_mocks/invitations.mock"
import { dedupliquerParApprenant } from "@/lib/formateurDashboard"
import type { Group } from "@/types/group"
import type { ApprenantSummary } from "@/types/apprenantSummary"

export interface GroupStatsRow {
    group: Group
    memberCount: number
    pendingInvitationCount: number
    averageProgress: number
    lateCount: number
}

/**
 * Une ligne de statistiques par groupe, pour la page Groupes, les deux
 * accueils et l'écran de comparaison.
 *
 * La progression moyenne n'est pas recalculée ici : elle arrive sur le groupe,
 * établie par le serveur à partir des fiches apprenant. Deux écrans qui
 * l'additionneraient chacun de leur côté finiraient par afficher deux
 * chiffres, et un client autre que celui-ci n'aurait aucun moyen de retrouver
 * le nôtre.
 *
 * Effectifs et invitations passent par les lectures de lot : une lecture par
 * groupe ferait croître le nombre d'appels avec le nombre de lignes affichées.
 *
 * Les fiches ne sont pas dédupliquées ici : filtrées par groupe, chaque
 * personne n'y figure qu'une fois, et elle compte dans chacun de ses groupes.
 */
export async function computeGroupStatsRows(
    groups: Group[],
    summaries: ApprenantSummary[],
): Promise<GroupStatsRow[]> {
    const groupIds = groups.map((group) => group.id)

    const [memberCounts, invitationsParGroupe] = await Promise.all([
        getGroupMemberCounts(groupIds),
        getInvitationsForGroups(groupIds),
    ])

    return groups.map((group) => {
        const groupSummaries = summaries.filter((summary) => summary.groupId === group.id)

        return {
            group,
            memberCount: memberCounts.get(group.id) ?? 0,
            pendingInvitationCount: (invitationsParGroupe.get(group.id) ?? [])
                .filter((invitation) => invitation.status === "pending").length,
            averageProgress: group.averageProgressPercent,
            lateCount: groupSummaries.reduce(
                (somme, summary) => somme + summary.lateModuleTitles.length, 0),
        }
    })
}

/**
 * Trié par progression décroissante, pas juste la liste brute (déjà
 * disponible ailleurs) — la vraie valeur d'une page "Statistiques" est de
 * comparer, pas de reformuler ce qui existe déjà sur la page Groupes.
 */
export function rankGroupStatsRows(rows: GroupStatsRow[]): GroupStatsRow[] {
    return [...rows].sort((a, b) => b.averageProgress - a.averageProgress)
}

export interface FormateurStatsRow {
    formateurId: string
    formateurName: string
    groupCount: number
    apprenantCount: number
    averageProgress: number
    lateCount: number
}

/**
 * Agrège les lignes de groupe par contact (voir Group.contact,
 * types/group.ts) — réservé au gestionnaire, comparer des formateurs
 * entre eux n'a pas de sens du point de vue d'un formateur qui ne voit
 * que ses propres groupes. La moyenne est calculée sur TOUS les
 * apprenants du formateur (pas une moyenne des moyennes de groupe), pour
 * ne pas fausser le résultat si ses groupes ont des tailles très
 * différentes.
 *
 * Les fiches sont dédupliquées : un apprenant présent dans trois groupes du
 * même formateur est une seule personne, et son score ne doit peser qu'une
 * fois dans la moyenne.
 */
export function computeFormateurStatsRows(groupRows: GroupStatsRow[], summaries: ApprenantSummary[]): FormateurStatsRow[] {
    const byFormateur = new Map<string, { name: string; groupIds: Set<string> }>()
    for (const row of groupRows) {
        const formateurId = row.group.contact.id
        if (!byFormateur.has(formateurId)) {
            byFormateur.set(formateurId, { name: row.group.contact.fullName, groupIds: new Set() })
        }
        byFormateur.get(formateurId)!.groupIds.add(row.group.id)
    }

    return Array.from(byFormateur.entries()).map(([formateurId, { name, groupIds }]) => {
        const relevantSummaries = dedupliquerParApprenant(
            summaries.filter((summary) => groupIds.has(summary.groupId)))
        const apprenantCount = relevantSummaries.length
        const averageProgress =
            apprenantCount > 0
                ? Math.round(relevantSummaries.reduce((sum, summary) => sum + summary.progressPercent, 0) / apprenantCount)
                : 0
        const lateCount = relevantSummaries.reduce((sum, summary) => sum + summary.lateModuleTitles.length, 0)
        return { formateurId, formateurName: name, groupCount: groupIds.size, apprenantCount, averageProgress, lateCount }
    })
}