"use server"

import { api, apiTolerant } from "@/lib/api"
import { removeGroupMembership } from "@/_mocks/groupMemberships.actions"
import type { ApprenantSummary } from "@/types/apprenantSummary"

/** Apprenants des groupes gérés par le formateur connecté. */
export async function getApprenantSummariesForFormateur(
    formateurUserId: string
): Promise<ApprenantSummary[]> {
    void formateurUserId

    return await apiTolerant(
        () => api.get<ApprenantSummary[]>("/api/dashboard/apprenant-summaries"),
        [],
    )
}

/** Tous les apprenants de l'organisation, quel que soit le gestionnaire du groupe. */
export async function getApprenantSummariesForOrganization(
    organizationId: string
): Promise<ApprenantSummary[]> {
    void organizationId

    return await apiTolerant(
        () => api.get<ApprenantSummary[]>("/api/dashboard/apprenant-summaries/organisation"),
        [],
    )
}

/**
 * Retire un apprenant de la liste d'un groupe en désactivant son adhésion.
 * Le résumé, dérivé des adhésions, disparaît de lui-même.
 */
export async function removeApprenantSummary(userId: string, groupId: string): Promise<void> {
    await removeGroupMembership(groupId, userId)
}