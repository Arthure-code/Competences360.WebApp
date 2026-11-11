import { getGroupsForOrganization, getGroupBySlug } from "@/_mocks/groups.mock"
import type { Group } from "@/types/group"

/** Groupes d'une organisation. */
export async function getGroupsForOrganizationWithFallback(organizationId: string): Promise<Group[]> {
    return await getGroupsForOrganization(organizationId)
}

/** Groupe par slug, utilisé par la page détail groupe Admin, qui ne connaît pas l'org à l'avance. */
export async function getGroupBySlugWithFallback(slug: string): Promise<Group | undefined> {
    return await getGroupBySlug(slug)
}
