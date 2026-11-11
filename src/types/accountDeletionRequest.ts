import type { Role } from "@/constants/roles"

export type AccountDeletionRequestStatus = "pending" | "approved" | "denied"

/**
 * Un apprenant lié à un groupe, ou un formateur, ne peut pas supprimer son
 * compte directement — passe par une demande. Sans rapport avec le
 * versionnage de contenu (deux logiques différentes : approbation
 * formelle vs curation libre) .
 */
export interface AccountDeletionRequest {
    id: string
    userId: string
    /** Dénormalisé pour la file du gestionnaire, évite un lookup pour chaque ligne */
    userFullName: string
    role: Role
    /**
     * Absent pour un apprenant — peut être lié à des groupes de plusieurs
     * organisations différentes, pas de organizationId unique à ce niveau.
     * Toujours présent pour formateur/gestionnaire (un seul par compte).
     */
    organizationId?: string
    reason?: string
    status: AccountDeletionRequestStatus
    requestedAt: string
    reviewedByUserId?: string
    reviewedAt?: string
    reviewNote?: string
}