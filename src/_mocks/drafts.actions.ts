"use server"

import { api, apiTolerant } from "@/lib/api"

/** Charge le brouillon du compte connecté pour cette clé (GET /api/drafts/{key}), null s'il n'y en a pas. */
export async function chargerBrouillon<T>(cle: string): Promise<T | null> {
    return await apiTolerant(
        () => api.get<T | null>(`/api/drafts/${encodeURIComponent(cle)}`),
        null,
    )
}

/** Enregistre le brouillon de cette clé en remplaçant le précédent (PUT /api/drafts/{key}). */
export async function enregistrerBrouillon(cle: string, contenu: unknown): Promise<void> {
    await api.put(`/api/drafts/${encodeURIComponent(cle)}`, contenu)
}

/** Efface le brouillon de cette clé (DELETE /api/drafts/{key}). */
export async function effacerBrouillon(cle: string): Promise<void> {
    await api.delete(`/api/drafts/${encodeURIComponent(cle)}`)
}
