import { getOrganizationMembers, type OrganizationMember } from "@/_mocks/organizationMembers.mock"

/** Membres d'une organisation, comptes désactivés compris. */
export async function getOrganizationMembersWithOverrides(organizationId: string): Promise<OrganizationMember[]> {
    return await getOrganizationMembers(organizationId)
}
