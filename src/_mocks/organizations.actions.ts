"use server"

import { ADMIN_COOKIE, api } from "@/lib/api"

/**
 * Renomme l'organisation. Seul champ modifiable pour l'instant, le statut
 * d'abonnement étant fixé tant qu'il n'y a pas de système de facturation.
 */
export async function updateOrganizationName(organizationId: string, name: string): Promise<void> {
    await api.put(`/api/organizations/${encodeURIComponent(organizationId)}`, {
        name: name.trim(),
    })
}

/** Active ou désactive une organisation. Réservé à la console d'administration. */
export async function setOrganizationActive(organizationId: string, organizationName: string, isActive: boolean): Promise<void> {
    void organizationName
    const geste = isActive ? "reactiver" : "suspendre"

    await api.put(
        `/api/admin/organisations/${encodeURIComponent(organizationId)}/${geste}`,
        undefined,
        { cookieName: ADMIN_COOKIE },
    )
}
