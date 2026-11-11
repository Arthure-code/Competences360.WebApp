"use server"

import { api, apiTolerant } from "@/lib/api"
import { assertCompteConnecte, getCurrentSession } from "@/_mocks/users.mock"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import type { Group } from "@/types/group"

/**
 * Groupes dont un apprenant est membre actif.
 *
 * Sans identifiant, ou avec celui de la session, ce sont ceux du compte
 * connecté. Avec celui de QUELQU'UN D'AUTRE, la lecture passe par une route
 * dédiée qui borne la réponse aux groupes que l'appelant peut déjà voir.
 * Une session d'administration lit toujours les groupes de l'apprenant demandé.
 *
 * Cette exception au principe général est nécessaire : le personnel doit
 * savoir à quels groupes appartient un apprenant pour lui signaler qu'une
 * assignation de groupe couvre déjà le même module. Sans elle, la question
 * était posée pour l'apprenant et répondue pour le formateur, en silence.
 *
 * L'identifiant reste une demande, pas une autorisation : c'est l'API qui
 * décide de ce qu'elle rend.
 */
export async function getMyGroups(userId: string): Promise<Group[]> {
    if (userId && await getCurrentAdminSession()) {
        return await apiTolerant(
            () => api.get<Group[]>(`/api/groups/apprenant/${encodeURIComponent(userId)}`),
            [],
        )
    }

    const session = await getCurrentSession()

    const chemin =
        userId && String(userId) !== String(session.user.id)
            ? `/api/groups/apprenant/${encodeURIComponent(userId)}`
            : "/api/groups/mes-groupes"

    return await apiTolerant(
        () => api.get<Group[]>(chemin),
        [],
    )
}

/** Rend `undefined` si aucun groupe actif ne porte ce slug. */
export async function getGroupBySlug(slug: string): Promise<Group | undefined> {
    const group = await apiTolerant(
        () => api.get<Group | null>(`/api/groups/slug/${encodeURIComponent(slug)}`),
        null,
    )

    return group ?? undefined
}

/**
 * Résout un code de jonction saisi à la main. La casse et les espaces sont
 * normalisés côté API.
 */
export async function getGroupByJoinCode(code: string): Promise<Group | undefined> {
    const trimmed = code.trim()
    if (trimmed.length === 0) return undefined

    const group = await apiTolerant(
        () => api.get<Group | null>(`/api/groups/code/${encodeURIComponent(trimmed)}`),
        null,
    )

    return group ?? undefined
}

/** Nombre de membres actifs. Rend 0 si le groupe est hors de portée. */
export async function getGroupMemberCount(groupId: string): Promise<number> {
    return await apiTolerant(
        () => api.get<number>(`/api/groups/${encodeURIComponent(groupId)}/nombre-membres`),
        0,
    )
}

/**
 * Code QR d'adhésion, généré par l'API. Lu seulement par les deux pages de
 * détail : l'embarquer dans GroupFrontDto alourdirait chaque liste de
 * groupes d'une image que personne n'y affiche.
 */
export async function getGroupQrCode(groupId: string): Promise<string | undefined> {
    const codeQr = await apiTolerant(
        () => api.get<{ url: string } | null>(
            `/api/groups/${encodeURIComponent(groupId)}/code-qr`),
        null,
    )

    return codeQr?.url
}

/**
 * Code QR du lien d'adhésion à partir du code seul. Sert à l'écran de
 * jonction, où la personne connaît le code mais n'est membre d'aucun groupe :
 * aucune lecture de groupe n'est possible, l'API se contente d'encoder.
 * Sans code, le QR mène à la page d'adhésion elle-même.
 */
export async function getJoinQrCodeForCode(code?: string): Promise<string | undefined> {
    const chemin = code
        ? `/api/groups/code-qr/${encodeURIComponent(code)}`
        : "/api/groups/code-qr"

    const codeQr = await apiTolerant(
        () => api.get<{ url: string } | null>(chemin),
        null,
    )

    return codeQr?.url
}

/**
 * Même chose pour plusieurs groupes en un appel. Un identifiant hors de
 * portée est absent de la réponse, et ne figure donc pas dans la table.
 */
export async function getGroupMemberCounts(
    groupIds: string[]
): Promise<Map<string, number>> {
    if (groupIds.length === 0) return new Map()

    const lignes = await apiTolerant(
        () => api.post<{ groupId: string; count: number }[]>(
            "/api/groups/nombre-membres/lot", { groupIds: groupIds.map(Number) }),
        [],
    )

    return new Map(lignes.map((ligne) => [String(ligne.groupId), ligne.count]))
}

/**
 * Groupes dont le compte connecté est formateur.
 *
 * Divergence connue avec la version simulée : celle-ci rendait les groupes
 * dont l'utilisateur est le contact, l'API rend ceux où il figure comme
 * formateur. Sur un groupe à plusieurs formateurs, l'API les montre tous.
 */
export async function getMyManagedGroups(userId: string): Promise<Group[]> {
    await assertCompteConnecte(userId, "getMyManagedGroups")

    return await apiTolerant(
        () => api.get<Group[]>("/api/groups/mes-groupes-geres"),
        [],
    )
}

/** Tous les groupes de l'organisation, vue gestionnaire. */
export async function getGroupsForOrganization(organizationId: string): Promise<Group[]> {
    return await apiTolerant(
        () => api.get<Group[]>(
            `/api/groups/organisation/${encodeURIComponent(organizationId)}`),
        [],
    )
}