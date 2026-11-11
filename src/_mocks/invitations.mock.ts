"use server"

import { api, apiTolerant } from "@/lib/api"
import type { Invitation } from "@/types/invitation"

/**
 * Lectures sur Invitation — branché sur l'API.
 *
 * L'ordre (plus récentes en premier) est garanti côté API pour les trois
 * listes, il fait partie du contrat.
 */

/**
 * Valide un lien d'invitation. Ne rend QUE les invitations encore en
 * attente : un lien déjà accepté ou périmé ne doit pas rouvrir un parcours
 * d'inscription.
 */
interface InvitationValidationPayload {
    isValid: boolean
    email?: string
    roles?: Invitation["roles"]
    idOrganization?: string
    organizationName?: string
    /** « introuvable », « dejaUtilisee » ou « expiree » quand isValid est faux. */
    motif?: MotifInvitationRefusee
}

/** Pourquoi un lien d'invitation ne mène nulle part. */
export type MotifInvitationRefusee = "introuvable" | "dejaUtilisee" | "expiree"

/**
 * Pourquoi ce lien ne mène nulle part — null si l'invitation est utilisable.
 *
 * La page d'invitation ne pouvait rien dire de plus que « invalide », et pire :
 * l'API répondait 400, code non toléré ici, si bien que l'exception remontait
 * et qu'un lien déjà utilisé affichait « Une erreur est survenue ». La route
 * répond maintenant 200 avec son motif.
 */
export async function getMotifInvitationRefusee(
    token: string,
): Promise<MotifInvitationRefusee | null> {
    const trimmed = token.trim()
    if (!trimmed) return "introuvable"

    const result = await apiTolerant(
        () => api.get<InvitationValidationPayload>(
            `/api/invitations/validate?token=${encodeURIComponent(trimmed)}`,
            { anonymous: true },
        ),
        { isValid: false, motif: "introuvable" },
    )

    return result.isValid ? null : (result.motif ?? "introuvable")
}

/**
 * L'invitation ET le nom de son organisation, en un seul appel ANONYME.
 *
 * La page allait chercher ce nom par `getOrganizationById` — une route
 * authentifiée. Un visiteur qui clique son lien n'a pas de session : la route
 * répondait 401, le nom repartait vide, et l'écran annonçait « Vous rejoignez
 * ␣ en tant que formateur ». Le défaut ne se voyait qu'en navigation privée,
 * puisqu'une session ouverte le masquait.
 *
 * La route de validation rend déjà `organizationName`. Il n'y avait pas de
 * second appel à faire.
 */
export async function getInvitationAvecOrganisation(
    token: string,
): Promise<{ invitation: Invitation; organizationName: string } | undefined> {
    const trimmed = token.trim()
    if (!trimmed) return undefined

    const result = await apiTolerant(
        () => api.get<InvitationValidationPayload>(
            `/api/invitations/validate?token=${encodeURIComponent(trimmed)}`,
            { anonymous: true },
        ),
        { isValid: false },
    )

    if (!result.isValid) return undefined

    return {
        invitation: {
            id: "",
            token: trimmed,
            email: result.email ?? "",
            roles: result.roles ?? [],
            organizationId: result.idOrganization ?? "",
            status: "pending",
            invitedByUserId: "",
            sentAt: "",
        },
        organizationName: result.organizationName ?? "",
    }
}

export async function getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const trimmed = token.trim()
    if (!trimmed) return undefined

    const result = await apiTolerant(
        () => api.get<InvitationValidationPayload>(
            `/api/invitations/validate?token=${encodeURIComponent(trimmed)}`,
            { anonymous: true },
        ),
        { isValid: false },
    )

    if (!result.isValid) return undefined

    // La route de validation ne rend PAS une invitation complète, et c'est
    // voulu : elle est anonyme, elle ne doit divulguer que ce dont le
    // formulaire d'inscription a besoin. id, invitedByUserId et sentAt n'en
    // font pas partie — ils sont posés à des valeurs neutres ici, aucun
    // consommateur de cette page ne les lit.
    return {
        id: "",
        token: trimmed,
        email: result.email ?? "",
        roles: result.roles ?? [],
        organizationId: result.idOrganization ?? "",
        status: "pending",
        invitedByUserId: "",
        sentAt: "",
    }
}

/** Invitations envoyées par cet utilisateur — l'API répond pour le compte connecté. */
export async function getMySentInvitations(invitedByUserId: string): Promise<Invitation[]> {
    void invitedByUserId

    return await apiTolerant(
        () => api.get<Invitation[]>("/api/invitations/mes-invitations"),
        [],
    )
}

/** Invitations envoyées pour rejoindre CE groupe précis. */
export async function getInvitationsForGroup(groupId: string): Promise<Invitation[]> {
    return await apiTolerant(
        () => api.get<Invitation[]>(`/api/invitations/groupe/${encodeURIComponent(groupId)}`),
        [],
    )
}

/**
 * Variante en LOT. Le coût d'une liste ne doit pas suivre sa longueur : une
 * page de 50 groupes faisait 50 allers-retours, alors que l'API sait
 * répondre en un seul. C'est le N+1 déjà corrigé côté base (voir
 * GroupService.MapManyAsync), qui s'était réinstallé sur le réseau.
 *
 * Un identifiant hors de portée est simplement ABSENT de la réponse : la
 * fonction retombe alors sur une liste vide pour lui, comme le faisait la lecture
 * unitaire.
 */
export async function getInvitationsForGroups(
    groupIds: string[]
): Promise<Map<string, Invitation[]>> {
    if (groupIds.length === 0) return new Map()

    const lignes = await apiTolerant(
        () => api.post<{ groupId: string; invitations: Invitation[] }[]>(
            "/api/invitations/groupe/lot", { groupIds: groupIds.map(Number) }),
        [],
    )

    return new Map(lignes.map((ligne) => [String(ligne.groupId), ligne.invitations]))
}

/** Toutes les invitations de l'organisation, tous expéditeurs confondus — vue gestionnaire. */
export async function getInvitationsForOrganization(
    organizationId: string
): Promise<Invitation[]> {
    return await apiTolerant(
        () => api.get<Invitation[]>(
            `/api/invitations/organisation/${encodeURIComponent(organizationId)}`),
        [],
    )
}