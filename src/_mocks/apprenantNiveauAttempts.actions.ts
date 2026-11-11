"use server"

import { api, apiTolerant } from "@/lib/api"

/**
 * Journalise une tentative terminée, appelée au redémarrage d'une activité.
 *
 * `userId` et `moduleId` ne sont pas transmis, le serveur les établissant
 * lui-même. Les titres d'activité et de module ne le sont pas non plus : le
 * serveur les lit dans le contenu et les fige au moment de l'écriture.
 *
 * Silencieuse en cas de refus : le redémarrage reste la priorité pour
 * l'apprenant.
 */
export async function logNiveauAttempt(entry: {
    userId: string
    moduleId: string
    niveauId: string
    attemptNumber: number
    score: number
    maxScore: number
    timeSpentMs: number
}): Promise<void> {
    void entry.userId
    void entry.moduleId

    await apiTolerant(
        () => api.post("/api/progression-apprenant/tentative", {
            niveauId: entry.niveauId,
            attemptNumber: entry.attemptNumber,
            score: entry.score,
            maxScore: entry.maxScore,
            timeSpentMs: entry.timeSpentMs,
        }),
        null,
    )
}