"use server"

import { api } from "@/lib/api"

/**
 * Ajoute au groupe un apprenant qui a déjà un compte. Un retour réactive
 * l'adhésion précédente et sa progression, sans en créer une seconde.
 */
export async function addGroupMembership(groupId: string, userId: string): Promise<void> {
    await api.post(
        `/api/groups/${encodeURIComponent(groupId)}/membres/${encodeURIComponent(userId)}`)
}

/**
 * Désactive l'adhésion sans la retirer. La progression reste récupérable
 * pendant la fenêtre de rétention, ensuite le lien au groupe est rompu et la
 * contribution ne subsiste qu'en statistique anonyme.
 */
export async function removeGroupMembership(groupId: string, userId: string): Promise<void> {
    await api.delete(
        `/api/groups/${encodeURIComponent(groupId)}/membres/${encodeURIComponent(userId)}`)
}

/**
 * Sans effet. La purge des adhésions quittées est une tâche de fond serveur
 * (`AnonymisationBackgroundService`). Conservée pour ne pas toucher aux
 * appelants.
 */
export async function purgeGroupMembership(groupId: string, userId: string): Promise<void> {
    void groupId
    void userId
}