"use server"

import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import type { Organization } from "@/types/organization"

/**
 * Crée l'organisation et rattache son créateur comme premier gestionnaire.
 * Le fondateur vient des claims, pas du corps.
 */
export async function createOrganization(
    name: string,
    creatorUserId: string
): Promise<Organization> {
    void creatorUserId

    return await api.post<Organization>("/api/organizations/avec-fondateur", { name })
}

/**
 * Rend `undefined` si l'organisation est introuvable ou hors de portée.
 * Un identifiant vide n'est pas envoyé : il viserait la route collection.
 */
export async function getOrganizationById(
    organizationId: string
): Promise<Organization | undefined> {
    if (!organizationId) return undefined

    const organization = await apiTolerant(
        () => api.get<Organization | null>(
            `/api/organizations/${encodeURIComponent(organizationId)}`),
        null,
    )

    return organization ?? undefined
}

/**
 * Recherche par nom, insensible à la casse et sur sous-chaîne. Une requête
 * vide ne part pas : elle rendrait tout l'annuaire à un visiteur sans compte.
 */
export async function searchOrganizationsByName(query: string): Promise<Organization[]> {
    const normalized = query.trim()
    if (!normalized) return []

    return await apiTolerant(
        () => api.get<Organization[]>(
            `/api/organizations/recherche?q=${encodeURIComponent(normalized)}`),
        [],
    )
}

/** Retourne toutes les organisations de la plateforme, actives ou non. Réservé à la console d'administration. */
export async function getAllOrganizations(): Promise<Organization[]> {
    return await apiTolerant(
        () => api.get<Organization[]>("/api/organizations", { cookieName: ADMIN_COOKIE }),
        [],
    )
}
