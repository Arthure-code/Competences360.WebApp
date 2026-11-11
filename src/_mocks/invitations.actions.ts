"use server"

import { api, ApiError, StatutHttp } from "@/lib/api"
import type { Invitation } from "@/types/invitation"

export interface ResultatEnvoiInvitations {
    created: Invitation[]
    /** Messages de refus de l'API, un par adresse écartée, déjà en français. */
    erreurs: string[]
}

interface ReponseLot {
    created?: Invitation[]
    errors?: { email: string; message: string }[]
}

function versResultat(reponse: ReponseLot): ResultatEnvoiInvitations {
    return {
        created: reponse.created ?? [],
        erreurs: (reponse.errors ?? []).map(
            (refus) => `${refus.email} : ${refus.message}`),
    }
}

interface SendInvitationInput {
    email: string
    roles: Invitation["roles"]
    organizationId: string
    groupIds?: string[]
    invitedByUserId: string
}

/**
 * Envoi en lot — une adresse en échec n'annule pas les autres : la réponse
 * porte les invitations créées ET les refus, adresse par adresse. Quand
 * TOUTES échouent, l'API répond 400 avec le même corps — on le lit au lieu
 * de le jeter, sans quoi « déjà membre » s'affichait en page d'erreur.
 *
 * `roles` est un TABLEAU : un gestionnaire peut inviter quelqu'un comme
 * formateur ET gestionnaire d'un coup. L'API valide la combinaison
 * demandée et refuse notamment qu'un formateur fabrique un gestionnaire
 * (voir InvitationRoleRules).
 *
 * organizationId et invitedByUserId ne sont pas transmis : l'API les déduit
 * du compte connecté.
 */
export async function sendInvitations(inputs: SendInvitationInput[]): Promise<ResultatEnvoiInvitations> {
    if (inputs.length === 0) return { created: [], erreurs: [] }

    try {
        const result = await api.post<ReponseLot>("/api/invitations/lot", {
            invitations: inputs.map((input) => ({
                email: input.email,
                roleCible: input.roles[0],
                roles: input.roles,
                groupIds: (input.groupIds ?? []).map(Number),
            })),
        })

        return versResultat(result)
    } catch (error) {
        const lot = error instanceof ApiError
            && error.status === StatutHttp.RequeteInvalide
            && typeof error.payload === "object"
            && error.payload !== null
            && Array.isArray((error.payload as ReponseLot).errors)
            ? (error.payload as ReponseLot)
            : null

        if (lot === null) throw error

        return versResultat(lot)
    }
}

/**
 * Annuler retire l'invitation : il n'existe pas de statut « annulée ».
 * Réservé à l'expéditeur, règle appliquée par l'API.
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/api/invitations/${encodeURIComponent(invitationId)}`)
}