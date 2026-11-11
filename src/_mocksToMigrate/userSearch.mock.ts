"use server"

import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import { getOrganizationMembers, type OrganizationMember } from "@/_mocks/organizationMembers.mock"

export interface UserSearchResult extends OrganizationMember {
    organizationId: string
    organizationName: string
}

/** Cherche par nom ou courriel à travers toutes les orgs. Query vide = aucun résultat. */
export async function searchUsersAcrossOrgs(query: string): Promise<UserSearchResult[]> {
    const normalized = query.trim()
    if (!normalized) return []

    return await apiTolerant(
        () => api.get<UserSearchResult[]>(
            `/api/utilisateurs/recherche?q=${encodeURIComponent(normalized)}`, { cookieName: ADMIN_COOKIE }),
        [],
    )
}

/** Tous les membres d'UNE SEULE org — sert "Voir dans Utilisateurs" depuis le détail d'org. */
export async function getUsersForOrganization(organizationId: string, organizationName: string): Promise<UserSearchResult[]> {
    const members = await getOrganizationMembers(organizationId)
    return members.map((m) => ({ ...m, organizationId, organizationName }))
}

/** Une personne et son organisation — sert la page dossier unifiée (/admin/utilisateurs/[userId]). */
export async function getUserAcrossOrgs(userId: string): Promise<UserSearchResult | undefined> {
    const user = await apiTolerant(
        () => api.get<UserSearchResult | null>(
            `/api/utilisateurs/${encodeURIComponent(userId)}`, { cookieName: ADMIN_COOKIE }),
        null,
    )

    return user ?? undefined
}
