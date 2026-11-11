"use server"

import type { Role } from "@/constants/roles"
import {
    updateMemberOrganization as rattacherMembre,
    updateMemberRoles as remplacerRoles,
} from "@/_mocks/organizationMembers.actions"

/** Remplace les rôles d'un membre ; rend le motif du refus s'il y en a un. */
export async function updateMemberRoles(
    userId: string,
    roles: Role[],
    organizationId: string
): Promise<{ success: boolean; error?: string }> {
    return await remplacerRoles(userId, roles, organizationId)
}

/** Rattache un membre du personnel à une autre organisation. */
export async function updateMemberOrganization(userId: string, organizationId: string): Promise<void> {
    await rattacherMembre(userId, organizationId)
}
