"use server"

import { api, apiTolerant } from "@/lib/api"
import { assertCompteConnecte } from "@/_mocks/users.mock"
import type { AccountDeletionRequest } from "@/types/accountDeletionRequest"
import type { Role } from "@/constants/roles"

/**
 * Demandes de suppression de compte, branchées sur l'API.
 *
 * Les identités reçues en paramètre sont gardées pour ne pas toucher aux
 * appelants, mais ne sont pas transmises : l'API déduit le demandeur du
 * compte connecté, et le gestionnaire de son organisation.
 */

/** Demande en cours du compte connecté, `null` si aucune. */
export async function getMyPendingDeletionRequest(userId: string): Promise<AccountDeletionRequest | null> {
    await assertCompteConnecte(userId, "getMyPendingDeletionRequest")

    // 204 quand aucune demande n'est en cours : l'état normal, pas une erreur.
    return await apiTolerant(
        () => api.get<AccountDeletionRequest | null>("/api/users/demande-suppression/moi"),
        null,
    )
}

/**
 * File d'attente d'un gestionnaire — l'autre bout du flux de
 * DangerZoneCard. L'organisation vient des claims, pas du paramètre.
 */
export async function getPendingDeletionRequestsForOrganization(organizationId: string): Promise<AccountDeletionRequest[]> {
    void organizationId

    return await apiTolerant(
        () => api.get<AccountDeletionRequest[]>("/api/gestionnaire/suppressions/en-attente"),
        [],
    )
}

interface SubmitDeletionRequestInput {
    userId: string
    userFullName: string
    role: Role
    /** Absent pour un apprenant — voir la note sur AccountDeletionRequest.organizationId */
    organizationId?: string
    reason?: string
}

/**
 * Dépose la demande et arme le compte à rebours de suppression. Seul le
 * motif part : nom, rôle et organisation sont figés côté serveur au dépôt.
 */
export async function submitDeletionRequest(input: SubmitDeletionRequestInput): Promise<AccountDeletionRequest> {
    return await api.post<AccountDeletionRequest>("/api/users/demande-suppression", {
        reason: input.reason,
    })
}

/** Le demandeur retire sa propre demande, le compte redevient actif. */
export async function cancelDeletionRequest(requestId: string): Promise<void> {
    await api.delete(`/api/users/demande-suppression/${encodeURIComponent(requestId)}`)
}

/** Approuve une demande, ce qui déclenche la suppression du compte visé. */
export async function approveDeletionRequest(requestId: string, reviewedByUserId: string): Promise<void> {
    void reviewedByUserId

    await api.put(`/api/gestionnaire/suppressions/${encodeURIComponent(requestId)}/autoriser`)
}

/** Refuse une demande : le compte reste actif, la note explique pourquoi. */
export async function denyDeletionRequest(requestId: string, reviewedByUserId: string, reviewNote?: string): Promise<void> {
    void reviewedByUserId

    await api.put(
        `/api/gestionnaire/suppressions/${encodeURIComponent(requestId)}/refuser`,
        { reviewNote },
    )
}