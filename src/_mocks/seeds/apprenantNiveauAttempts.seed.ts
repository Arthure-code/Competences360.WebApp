import type { ApprenantNiveauAttempt } from "@/types/apprenantNiveauAttempt"

/**
 * Correspond au scénario de apprenantModuleProgress.seed.ts pour
 * usr-marie-lariviere — mv2-n2 y a totalAttemptsCount: 2 (Persévérance),
 * donc 2 tentatives journalisées ici : la 1ère échouée, la 2e réussie,
 * dans le même ordre de grandeur temporel (autour de daysAgo(10)).
 */
export function getApprenantNiveauAttemptsSeed(): ApprenantNiveauAttempt[] {
    const now = Date.now()
    const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString()

    return [
        {
            id: "attempt-seed-1",
            userId: "usr-marie-lariviere",
            moduleId: "cm-2",
            niveauId: "mv2-n2",
            niveauTitle: "Gérer un désaccord",
            moduleTitle: "Communiquer en équipe — Contexte hôtelier",
            attemptNumber: 1,
            score: 0.25,
            maxScore: 1,
            timeSpentMs: 95_000,
            completedAt: daysAgo(11),
        },
        {
            id: "attempt-seed-2",
            userId: "usr-marie-lariviere",
            moduleId: "cm-2",
            niveauId: "mv2-n2",
            niveauTitle: "Gérer un désaccord",
            moduleTitle: "Communiquer en équipe — Contexte hôtelier",
            attemptNumber: 2,
            score: 1,
            maxScore: 1,
            timeSpentMs: 60_000,
            completedAt: daysAgo(10),
        },
    ]
}
