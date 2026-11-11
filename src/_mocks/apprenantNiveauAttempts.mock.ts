"use server"

import { api, apiTolerant } from "@/lib/api"
import type { ApprenantNiveauAttempt } from "@/types/apprenantNiveauAttempt"

/**
 * Journal des tentatives. Rien n'est tronqué côté serveur, l'historique
 * complet étant la raison d'être de la table : `limit` ne borne que ce
 * qu'une page demande.
 */

/** Tentatives les plus récentes d'un apprenant, toutes activités confondues. */
export async function getRecentAttemptsForApprenant(
    userId: string,
    limit = 10
): Promise<ApprenantNiveauAttempt[]> {
    return await apiTolerant(
        () => api.get<ApprenantNiveauAttempt[]>(
            `/api/progression-apprenant/apprenant/${encodeURIComponent(userId)}/tentatives`
            + `?limit=${limit}`),
        [],
    )
}

/** Tentatives les plus récentes sur une activité précise. */
export async function getRecentAttemptsForNiveau(
    userId: string,
    niveauId: string,
    limit = 10
): Promise<ApprenantNiveauAttempt[]> {
    return await apiTolerant(
        () => api.get<ApprenantNiveauAttempt[]>(
            `/api/progression-apprenant/apprenant/${encodeURIComponent(userId)}/tentatives`
            + `?niveauId=${encodeURIComponent(niveauId)}&limit=${limit}`),
        [],
    )
}