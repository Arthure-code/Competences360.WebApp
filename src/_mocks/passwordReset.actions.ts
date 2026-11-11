"use server"

import { redirect } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { routes } from "@/constants/routes"

/**
 * Demande un lien de réinitialisation. Ne signale jamais qu'une adresse est
 * inconnue : un message affiché pour elles seules les désignerait.
 */
export async function requestPasswordReset(email: string): Promise<void> {
    try {
        await api.post("/api/auth/forgot-password", { identifier: email.trim() }, { anonymous: true })
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
    }
}

/**
 * Réinitialise le mot de passe. Rend `false` si le jeton est refusé ; sur
 * succès, redirige vers la connexion et ne rend jamais la main.
 *
 * Le jeton porte l'identifiant du compte, le front n'a pas le courriel.
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
        await api.post(
            "/api/auth/reset-password",
            { token, newPassword, newPasswordConfirm: newPassword },
            { anonymous: true },
        )
    } catch (error) {
        if (error instanceof ApiError) return false
        throw error
    }

    redirect(routes.auth.login)
}