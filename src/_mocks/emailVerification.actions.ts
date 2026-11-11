"use server"

import { api, ApiError } from "@/lib/api"

/**
 * Consomme le jeton et marque le compte comme vérifié.
 *
 * Le jeton du lien porte l'utilisateur (LinkTokenCodec côté API) : rien
 * d'autre à transmettre. Il est à usage unique, invalidé par sa propre
 * consommation.
 */
export async function confirmEmailVerification(token: string): Promise<boolean> {
    try {
        await api.post("/api/verification/verify-email", { token }, { anonymous: true })
        return true
    } catch (error) {
        if (error instanceof ApiError) return false
        throw error
    }
}