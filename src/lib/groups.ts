import type { Group, GroupMembership } from "@/types/group"

/** Groupes dont `userId` est membre actif (leftAt absent), dérivé de GroupMembership, jamais stocké sur le profil apprenant. */
export function getGroupsForApprenant(
    groups: Group[],
    memberships: GroupMembership[],
    userId: string,
): Group[] {
    const groupIds = new Set(
        memberships
            .filter((membership) => membership.userId === userId && !membership.leftAt)
            .map((membership) => membership.groupId),
    )
    return groups.filter((group) => groupIds.has(group.id))
}

/** Groupes gérés par un formateur, dérivé de Group.contact.id, jamais stocké sur le profil formateur. */
export function getGroupsManagedByFormateur(groups: Group[], userId: string): Group[] {
    return groups.filter((group) => group.contact.id === userId)
}

export function getMemberCount(memberships: GroupMembership[], groupId: string): number {
    return memberships.filter((membership) => membership.groupId === groupId && !membership.leftAt).length
}

export function getMemberIds(memberships: GroupMembership[], groupId: string): string[] {
    return memberships
        .filter((membership) => membership.groupId === groupId && !membership.leftAt)
        .map((membership) => membership.userId)
}