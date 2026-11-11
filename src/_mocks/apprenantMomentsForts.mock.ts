"use server"

import { api, apiTolerant } from "@/lib/api"
import type { ApprenantMomentFortEntry } from "@/types/apprenantMomentFort"

/**
 * Moments forts d'un apprenant, du plus récent au plus ancien.
 *
 * Seuls les cinq moments événementiels viennent d'ici, détectés côté serveur
 * à l'enregistrement de la progression. « Module parfait » et « Rattrapage
 * réussi » restent dérivés à l'affichage, ne dépendant que de l'état final.
 */
export async function getMomentsFortsForApprenant(
    userId: string
): Promise<ApprenantMomentFortEntry[]> {
    return await apiTolerant(
        () => api.get<ApprenantMomentFortEntry[]>(
            `/api/progression-apprenant/apprenant/${encodeURIComponent(userId)}/moments-forts`),
        [],
    )
}