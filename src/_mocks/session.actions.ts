"use server"

import { redirect } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { logout } from "@/lib/auth"
import { ROLE_HOME_PATH, routes } from "@/constants/routes"
import { isRole } from "@/constants/roles"
import type { UserSession } from "@/types/user"

/**
 * Utilitaires de session appelables depuis un composant client.
 *
 * Séparé de users.mock.ts pour une raison précise : getCurrentSession
 * redirige quand la session est absente, ce qui est le bon comportement sur
 * une page protégée mais pas au retour d'une connexion, où il faut au
 * contraire décider OÙ aller.
 */

/**
 * Page d'atterrissage de l'utilisateur qui vient de se connecter.
 *
 * L'espace dépend des rôles portés, que seule la session connaît — le
 * formulaire de connexion, lui, n'a qu'un courriel. Gestionnaire prime sur
 * formateur quand les deux sont cumulés : c'est l'espace le plus complet.
 *
 * Les rôles reçus sont validés contre la liste fermée du front (isRole) :
 * un rôle inconnu — platformAdmin, ou une base désynchronisée — ne doit pas
 * produire une redirection vers une route qui n'existe pas.
 */
export async function landingPathForCurrentSession(): Promise<string> {
    let session: UserSession | null = null

    try {
        session = await api.get<UserSession>("/api/session")
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
    }

    const roles = (session?.user.roles ?? []).filter((role) => isRole(role))

    if (roles.includes("gestionnaire")) return ROLE_HOME_PATH.gestionnaire
    if (roles.includes("formateur")) return ROLE_HOME_PATH.formateur
    if (roles.includes("apprenant")) return ROLE_HOME_PATH.apprenant

    // Aucun rôle exploitable par l'application web : mieux vaut renvoyer au
    // formulaire que d'ouvrir un espace au hasard.
    return routes.auth.login
}

/**
 * Emmène vers l'espace du compte connecté, ou vers `destination` si elle est
 * fournie et INTERNE.
 *
 * `redirect()` appelé depuis une Server Action est la façon prévue par Next
 * de naviguer après une mutation de session : la réponse de l'action porte
 * l'ordre de redirection, et le cache du routeur client est invalidé par la
 * même occasion. C'est précisément ce qui manquait à `router.push`, dont la
 * navigation partait sur une version « déconnectée » de la cible — défaut
 * qu'un rechargement complet du navigateur masquait sans le corriger.
 */
export async function allerVersMonEspace(destination?: string | null): Promise<never> {
    const interne = destinationInterne(destination)

    redirect(interne ?? (await landingPathForCurrentSession()))
}

/** Ferme la session côté API et côté front, puis ramène au formulaire. */
export async function seDeconnecter(): Promise<never> {
    await logout()

    redirect(routes.auth.login)
}

/**
 * Page d'un module de contenu, dans l'espace du rôle COURANT.
 *
 * L'espace (formateur ou gestionnaire) est relu de la session, jamais d'une
 * prop : une prop `role` venue du client n'est qu'un affichage, pas une
 * autorité. Gestionnaire prime quand les deux rôles sont cumulés — même
 * règle que la page d'atterrissage.
 */
export async function allerVersModuleContenu(moduleId: string): Promise<never> {
    const espace = await espacePersonnel()

    redirect(routes[espace].contenu.module(moduleId))
}

/** Éditeur d'une version, dans l'espace du rôle courant. */
export async function allerVersEditionContenu(moduleId: string, versionId: string): Promise<never> {
    const espace = await espacePersonnel()

    redirect(routes[espace].contenu.edit(moduleId, versionId))
}

/** Page d'un groupe, dans l'espace du rôle courant. */
export async function allerVersGroupe(groupSlug: string): Promise<never> {
    const espace = await espacePersonnel()

    redirect(routes[espace].groupes.bySlug(groupSlug))
}

async function espacePersonnel(): Promise<"formateur" | "gestionnaire"> {
    let session: UserSession | null = null

    try {
        session = await api.get<UserSession>("/api/session")
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
    }

    const roles = (session?.user.roles ?? []).filter((role) => isRole(role))

    return roles.includes("gestionnaire") ? "gestionnaire" : "formateur"
}

/**
 * Une destination n'est suivie que si c'est un chemin INTERNE. Accepter une
 * URL absolue ferait de la connexion un tremplin de redirection ouverte : un
 * lien parfaitement authentique, qui dépose la personne sur un site tiers
 * juste après. `//ailleurs.com` et `/\ailleurs.com` comptent aussi comme
 * externes — les navigateurs les résolvent en absolu.
 */
function destinationInterne(valeur?: string | null): string | null {
    if (!valeur) return null
    if (!valeur.startsWith("/")) return null
    if (valeur.startsWith("//") || valeur.startsWith("/\\")) return null

    return valeur
}