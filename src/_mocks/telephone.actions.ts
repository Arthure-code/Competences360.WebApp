"use server"

import { api, ApiError } from "@/lib/api"

/** Rend le motif renvoyé par l'API (champ `detail`), ou le message de repli. */
function motif(error: ApiError, repli: string): string {
    const corps = error.payload as { detail?: string } | null | undefined
    return corps?.detail ?? repli
}

/** Envoie un code de vérification par SMS au numéro donné (POST /api/users/telephone). */
export async function demanderChangementTelephone(numero: string): Promise<{ succes: boolean; erreur?: string }> {
    try {
        await api.post("/api/users/telephone", { phoneNumber: numero })
        return { succes: true }
    } catch (error) {
        if (error instanceof ApiError) return { succes: false, erreur: motif(error, "Le code n'a pas pu être envoyé. Réessayez.") }
        throw error
    }
}

/** Vérifie le code reçu par SMS et enregistre le numéro (POST /api/users/telephone/verifier). */
export async function verifierChangementTelephone(numero: string, code: string): Promise<{ succes: boolean; erreur?: string }> {
    try {
        await api.post("/api/users/telephone/verifier", { phoneNumber: numero, code })
        return { succes: true }
    } catch (error) {
        if (error instanceof ApiError) return { succes: false, erreur: motif(error, "Ce code n'a pas pu être vérifié. Réessayez.") }
        throw error
    }
}
