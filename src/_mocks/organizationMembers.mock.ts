"use server"

import { api, apiTolerant } from "@/lib/api"
import type { Role } from "@/constants/roles"

export interface OrganizationMember {
    id: string
    fullName: string
    email: string
    roles: Role[]
    isActive: boolean
}

/** Ce que rend GET /api/gestionnaire/staff/{id}/dossier. */
export interface StaffDossierPayload {
    managedGroups: unknown[]
    apprenantCount: number
    draftCount: number
    publishedCount: number
    officialCount: number
}

/**
 * Annuaire de l'organisation, trié par nom. L'API ne garantit pas l'ordre,
 * qui compte à l'affichage.
 */
export async function getOrganizationMembers(
    organizationId: string
): Promise<OrganizationMember[]> {
    const members = await apiTolerant(
        () => api.get<OrganizationMember[]>(
            `/api/organizations/${encodeURIComponent(organizationId)}/membres`),
        [],
    )

    return [...members].sort((a, b) => a.fullName.localeCompare(b.fullName))
}

/**
 * Dossier d'un autre membre du personnel, réservé au gestionnaire de son
 * organisation. Rend `null` hors périmètre.
 */
export async function getStaffDossier(
    staffUserId: string
): Promise<StaffDossierPayload | null> {
    return await apiTolerant(
        () => api.get<StaffDossierPayload | null>(
            `/api/gestionnaire/staff/${encodeURIComponent(staffUserId)}/dossier`),
        null,
    )
}