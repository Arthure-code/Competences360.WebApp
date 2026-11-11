"use server"

import { ADMIN_COOKIE, ApiError, api } from "@/lib/api"
import type { Role } from "@/constants/roles"

/** Remplace les rôles d'un membre ; rend le motif du refus s'il y en a un. */
export async function updateMemberRoles(
    userId: string,
    roles: Role[],
    organizationId: string
): Promise<{ success: boolean; error?: string }> {
    void organizationId

    try {
        await api.put(
            `/api/utilisateurs/${encodeURIComponent(userId)}/roles`,
            { roles },
            { cookieName: ADMIN_COOKIE },
        )
        return { success: true }
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
        return { success: false, error: (error.payload as { detail?: string } | undefined)?.detail ?? error.message }
    }
}

/** Rattache un membre du personnel à une autre organisation. Réservé à la console d'administration. */
export async function updateMemberOrganization(userId: string, organizationId: string): Promise<void> {
    await api.put(
        `/api/utilisateurs/${encodeURIComponent(userId)}/organisation`,
        { idOrganization: Number(organizationId) },
        { cookieName: ADMIN_COOKIE },
    )
}
