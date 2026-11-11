"use server"

import { api, apiTolerant } from "@/lib/api"

/**
 * Enregistre la progression d'une activité. Appelée par `useNiveauProgress`
 * à chaque changement de meilleur score ou de complétion.
 *
 * `userId` et `moduleId` ne sont pas transmis : le serveur les établit
 * lui-même, depuis les claims et depuis l'activité. La détection des moments
 * forts se fait côté serveur, dans la même opération que cette écriture.
 *
 * Silencieuse en cas de refus : une progression non enregistrée ne doit pas
 * interrompre l'apprenant, le prochain envoi rattrapera.
 */
export async function upsertNiveauProgress(entry: {
    userId: string
    moduleId: string
    niveauId: string
    isDone: boolean
    bestScore: number | null
    maxScore: number
    totalAttemptsCount: number
    wasCleanPass: boolean
    /** Temps cumulé sur l'activité, jamais décroissant sauf redémarrage. */
    timeSpentMs: number
}): Promise<void> {
    void entry.userId
    void entry.moduleId

    await apiTolerant(
        () => api.post("/api/progression-apprenant/niveau", {
            niveauId: entry.niveauId,
            isDone: entry.isDone,
            bestScore: entry.bestScore,
            maxScore: entry.maxScore,
            totalAttemptsCount: entry.totalAttemptsCount,
            wasCleanPass: entry.wasCleanPass,
            timeSpentMs: entry.timeSpentMs,
        }),
        null,
    )
}