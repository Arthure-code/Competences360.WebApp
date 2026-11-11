"use server"

import { api, ApiError } from "@/lib/api"

export type StatutChangementCourriel = "applique" | "annule" | "retabli"

/** Demande le changement d'adresse ; le mot de passe actuel est exigé (POST /api/users/courriel). */
export async function demanderChangementCourriel(nouveauCourriel: string, motDePasse: string): Promise<{ succes: boolean; erreur?: string }> {
    try {
        await api.post("/api/users/courriel", { newEmail: nouveauCourriel.trim(), currentPassword: motDePasse })
        return { succes: true }
    } catch (error) {
        if (error instanceof ApiError) {
            const corps = error.payload as { detail?: string } | null | undefined
            return { succes: false, erreur: corps?.detail ?? "La demande n'a pas pu être envoyée. Vérifiez l'adresse, puis réessayez." }
        }
        throw error
    }
}

/** Confirme ou annule depuis le lien reçu ; rend l'état de la demande, ou null si le lien n'est plus valide (POST /api/users/courriel/confirmer). */
export async function confirmerChangementCourriel(token: string, adresse: "ancienne" | "nouvelle", annuler: boolean): Promise<StatutChangementCourriel | null> {
    try {
        const reponse = await api.post<{ statut: StatutChangementCourriel }>(
            "/api/users/courriel/confirmer", { token, adresse, annuler }, { anonymous: true })
        return reponse?.statut ?? null
    } catch (error) {
        if (error instanceof ApiError) return null
        throw error
    }
}
