"use server"

import type { Organization } from "@/types/organization"
import {
    getAllOrganizations as listerOrganisations,
    getOrganizationById,
} from "@/_mocks/organizations.mock"

/** Toutes les organisations de la plateforme, actives ou non. */
export async function getAllOrganizations(): Promise<Organization[]> {
    return await listerOrganisations()
}

/** Détail d'une organisation, ou undefined si elle est introuvable. */
export async function getOrganizationByIdWithOverride(organizationId: string): Promise<Organization | undefined> {
    return await getOrganizationById(organizationId)
}
