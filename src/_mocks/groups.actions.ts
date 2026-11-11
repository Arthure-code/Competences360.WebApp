"use server"

import { api } from "@/lib/api"
import type { Group, GroupContact } from "@/types/group"

interface CreateGroupInput {
    name: string
    organizationId: string
    contact: GroupContact
}

/**
 * Crée un groupe. Le créateur en devient premier formateur, donc contact,
 * sans appel supplémentaire. Le slug et le code de jonction sont posés par
 * l'API, seule à pouvoir en garantir l'unicité.
 *
 * `input.contact` n'est pas transmis : `CreateGroupDto` ne prend que le nom
 * et l'organisation. Le relire après création charge le formateur, absent de
 * la réponse de création.
 */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
    void input.contact

    const created = await api.post<Group>("/api/groups", {
        name: input.name,
        idOrganization: Number(input.organizationId),
    })

    return await api.get<Group>(`/api/groups/${created.id}`)
}

/** Renomme le groupe. Le slug, utilisé dans l'URL, ne change pas. */
export async function updateGroupName(groupId: string, name: string): Promise<void> {
    await api.put(`/api/groups/${encodeURIComponent(groupId)}`, { name: name.trim() })
}