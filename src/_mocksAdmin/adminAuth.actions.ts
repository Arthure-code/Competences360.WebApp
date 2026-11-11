"use server"

import { cookies } from "next/headers"
import { ADMIN_COOKIE, ApiError, api, apiBaseUrl, lireCookieDeReponse } from "@/lib/api"

/** Le cookie d'administration n'est envoyé par le navigateur qu'aux pages de la console. */
const CHEMIN_ADMINISTRATION = "/admin"

interface ActionResult {
    success: boolean
    error?: string
}

interface CreateAdminInput {
    firstName: string
    lastName: string
    email: string
    password: string
    isOwner?: boolean
    isRoot?: boolean
}

function messageDErreur(error: unknown): string {
    if (error instanceof ApiError) {
        const payload = error.payload as { message?: string; errors?: string[] } | undefined

        if (payload?.errors && payload.errors.length > 0) return payload.errors.join(" ")
        if (payload?.message) return payload.message
    }

    return "Une erreur est survenue."
}

async function executer(appel: Promise<unknown>): Promise<ActionResult> {
    try {
        await appel
        return { success: true }
    } catch (error) {
        return { success: false, error: messageDErreur(error) }
    }
}

/** Ouvre une session d'administration et pose son cookie sur le domaine du front. */
export async function loginAdmin(email: string, password: string): Promise<ActionResult> {
    let response: Response

    try {
        response = await fetch(`${apiBaseUrl()}/api/admin/auth/connexion`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ courriel: email, motDePasse: password }),
            cache: "no-store",
        })
    } catch {
        return { success: false, error: "Service indisponible. Réessayez dans un instant." }
    }

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        return { success: false, error: payload?.message ?? "Courriel ou mot de passe incorrect." }
    }

    const session = lireCookieDeReponse(response, ADMIN_COOKIE)

    if (!session) {
        return { success: false, error: "La session n'a pas pu être ouverte. Réessayez." }
    }

    const store = await cookies()
    store.set(ADMIN_COOKIE, session.valeur, {
        httpOnly: true,
        sameSite: "lax",
        path: CHEMIN_ADMINISTRATION,
        secure: process.env.NODE_ENV === "production",
        expires: session.expiration ?? undefined,
    })

    return { success: true }
}

/** Ferme la session d'administration et efface son cookie. */
export async function logoutAdmin(): Promise<void> {
    try {
        await api.post("/api/admin/auth/deconnexion", undefined, { cookieName: ADMIN_COOKIE })
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
    }

    const store = await cookies()
    store.set(ADMIN_COOKIE, "", { path: CHEMIN_ADMINISTRATION, maxAge: 0 })
}

/** Crée un compte d'administration. */
export async function createAdmin(input: CreateAdminInput): Promise<ActionResult> {
    return await executer(api.post("/api/admin/comptes", {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        motDePasse: input.password,
        isOwner: input.isOwner ?? false,
        isRoot: input.isRoot ?? false,
    }, { cookieName: ADMIN_COOKIE }))
}

/** Promeut un administrateur au rang de propriétaire. */
export async function promoteToOwner(adminId: string): Promise<ActionResult> {
    return await executer(
        api.put(`/api/admin/comptes/${adminId}/promouvoir`, undefined, { cookieName: ADMIN_COOKIE }),
    )
}

/** Rétrograde un propriétaire au rang d'administrateur. */
export async function demoteToAdmin(adminId: string): Promise<ActionResult> {
    return await executer(
        api.put(`/api/admin/comptes/${adminId}/retrograder`, undefined, { cookieName: ADMIN_COOKIE }),
    )
}

/** Révoque l'accès d'un compte d'administration sans le supprimer. */
export async function deactivateAdmin(adminId: string): Promise<ActionResult> {
    return await executer(
        api.put(`/api/admin/comptes/${adminId}/desactiver`, undefined, { cookieName: ADMIN_COOKIE }),
    )
}

/** Rétablit l'accès d'un compte d'administration désactivé. */
export async function reactivateAdmin(adminId: string): Promise<ActionResult> {
    return await executer(
        api.put(`/api/admin/comptes/${adminId}/reactiver`, undefined, { cookieName: ADMIN_COOKIE }),
    )
}

/** Désigne un compte racine. Le promeut propriétaire du même geste. */
export async function grantRootStatus(adminId: string): Promise<ActionResult> {
    return await executer(
        api.put(`/api/admin/comptes/${adminId}/racine`, undefined, { cookieName: ADMIN_COOKIE }),
    )
}

/** Retire le statut racine du compte en session. */
export async function removeMyRootStatus(): Promise<ActionResult> {
    return await executer(
        api.delete("/api/admin/comptes/moi/racine", { cookieName: ADMIN_COOKIE }),
    )
}

/** Change le mot de passe du compte en session. */
export async function changeAdminPassword(newPassword: string): Promise<ActionResult> {
    return await executer(api.put("/api/admin/comptes/moi/mot-de-passe", {
        nouveauMotDePasse: newPassword,
    }, { cookieName: ADMIN_COOKIE }))
}

/** Modifie le prénom, le nom, le prénom d'usage et le courriel du compte en session. */
export async function updateMyProfile(input: {
    firstName: string
    lastName: string
    preferredFirstName?: string
    email: string
}): Promise<ActionResult> {
    return await executer(api.put("/api/admin/comptes/moi", {
        firstName: input.firstName,
        lastName: input.lastName,
        preferredFirstName: input.preferredFirstName,
        email: input.email,
    }, { cookieName: ADMIN_COOKIE }))
}

/** Supprime définitivement le compte en session et ferme sa session. */
export async function deleteMyAccount(): Promise<ActionResult> {
    const resultat = await executer(
        api.delete("/api/admin/comptes/moi", { cookieName: ADMIN_COOKIE }),
    )

    if (resultat.success) await logoutAdmin()

    return resultat
}
