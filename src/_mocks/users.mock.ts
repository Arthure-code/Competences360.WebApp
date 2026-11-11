"use server"

import { redirect } from "next/navigation"
import { cache } from "react"
import { api, apiTolerant, StatutHttp } from "@/lib/api"
import { routes } from "@/constants/routes"
import type { UserSession } from "@/types/user"

/** Session en cours, résolution d'identifiants et compteurs de gestionnaires. */

/** Forme rendue par GET /api/users/par-courriel et GET /api/users/{id}. */
interface UserProfilePayload {
    id: number
    firstName: string
    lastName: string
}

/** Identité telle que le front la manipule, identifiant en chaîne. */
interface UserIdentity {
    id: string
    firstName: string
    lastName: string
}

/** Forme rendue par GET /api/users/{id}/actif. */
interface CompteActifPayload {
    userId: string
    active: boolean
}

/** Forme rendue par GET /api/users/organisation/{id}/nombre-gestionnaires. */
interface NombreGestionnairesPayload {
    organizationId: string
    managerCount: number
}

/** Convertit une réponse de l'API en identité, identifiant en chaîne. */
function toIdentity(profile: UserProfilePayload): UserIdentity {
    return {
        id: String(profile.id),
        firstName: profile.firstName,
        lastName: profile.lastName,
    }
}

/**
 * Rend la session du compte connecté, ou null si elle est absente ou périmée.
 * Le résultat est mémorisé pour la durée d'un rendu.
 *
 * À réserver aux pages qui doivent décider elles-mêmes où renvoyer un
 * visiteur déconnecté. Partout ailleurs, getCurrentSession suffit.
 */
export const lireSession = cache(async (): Promise<UserSession | null> => {
    return await apiTolerant<UserSession | null>(
        () => api.get<UserSession>("/api/session"),
        null,
        [StatutHttp.NonAuthentifie],
    )
})

/**
 * Rend la session du compte connecté, ou redirige vers la connexion si elle
 * est absente ou périmée.
 */
export async function getCurrentSession(): Promise<UserSession> {
    const session = await lireSession()

    if (session === null) redirect(routes.auth.login)

    return session
}

/** Cherche un compte par courriel. Rend `undefined` s'il n'existe pas. */
export async function getUserByEmail(email: string): Promise<UserIdentity | undefined> {
    const profile = await apiTolerant(
        () => api.get<UserProfilePayload | null>(
            `/api/users/par-courriel?email=${encodeURIComponent(email.trim().toLowerCase())}`),
        null,
    )

    return profile ? toIdentity(profile) : undefined
}

/**
 * Résout un identifiant en nom affichable. Rend `undefined` si le compte est
 * introuvable ou hors de l'organisation de l'appelant.
 */
export async function getUserById(userId: string): Promise<UserIdentity | undefined> {
    const profile = await apiTolerant(
        () => api.get<UserProfilePayload | null>(`/api/users/${encodeURIComponent(userId)}`),
        null,
    )

    return profile ? toIdentity(profile) : undefined
}

/** Indique si un compte est actif. Rend `false` s'il est hors de portée. */
export async function isAccountActive(userId: string): Promise<boolean> {
    const compte = await apiTolerant(
        () => api.get<CompteActifPayload | null>(
            `/api/users/${encodeURIComponent(userId)}/actif`),
        null,
    )

    return compte?.active ?? false
}

/** Donne le rôle de gestionnaire à un formateur de l'organisation. */
export async function promoteFormateurToGestionnaire(
    userId: string,
    organizationId: string
): Promise<void> {
    await api.put(
        `/api/users/${encodeURIComponent(userId)}/nommer-gestionnaire/${encodeURIComponent(organizationId)}`)
}

/** Compte les gestionnaires actifs. Rend 0 si l'organisation est hors de portée. */
export async function getOrganizationManagerCount(organizationId: string): Promise<number> {
    const compte = await apiTolerant(
        () => api.get<NombreGestionnairesPayload | null>(
            `/api/users/organisation/${encodeURIComponent(organizationId)}/nombre-gestionnaires`),
        null,
    )

    return compte?.managerCount ?? 0
}

/**
 * Lève en développement si `userId` ne désigne pas le compte connecté. Ces
 * lectures répondent toujours pour le compte authentifié : le paramètre est
 * ignoré, et un identifiant étranger rendrait des données fausses sans erreur.
 */
export async function assertCompteConnecte(userId: string, appelant: string): Promise<void> {
    if (process.env.NODE_ENV === "production") return

    const session = await getCurrentSession()

    if (userId && String(userId) !== String(session.user.id)) {
        throw new Error(
            `${appelant} a reçu ${userId} alors que le compte connecté est ` +
            `${session.user.id} : ce paramètre est ignoré par l'API.`,
        )
    }
}