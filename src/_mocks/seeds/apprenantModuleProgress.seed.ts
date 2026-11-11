import type { ApprenantModuleProgressEntry } from "@/types/apprenantModuleProgress"

/**
 * Données pures, aucune dépendance vers apprenantModuleProgress.mock.ts
 * (qui, lui, importe cette fonction) — évite toute circularité, et permet
 * de retirer/commenter ce seed sans jamais toucher à l'infrastructure
 * réelle (types, tableau, fonctions de lecture) dans le fichier mock.
 *
 * Scénario illustratif pour usr-marie-lariviere (voir users.mock.ts) —
 * simule ce que produirait vraiment useNiveauProgress/upsertNiveauProgress
 * après plusieurs sessions, sans avoir à jouer les exercices pour de
 * vrai. Couvre : des réussites propres (mv3-n1, mv2-n1, mv12-n1 — série
 * de réussites), une persévérance (mv2-n2, réussi seulement après un
 * restart), un module entier parfait (cm-2 : mv2-n1/n2/n3 tous à
 * bestScore === maxScore), et un niveau complété mais échoué, jamais
 * repris (mv3-n2, sous le seuil de 60%, voir lib/scoring.ts). mv3-n3 et
 * mv12-n2 restent sans entrée (jamais commencés).
 *
 * LIMITE CONNUE, PAS UN BUG : alimente uniquement Réussites (le seul
 * consommateur de ce store côté serveur). Modules, Accueil et Parcours
 * dépendent du localStorage DU NAVIGATEUR de qui teste — impossible d'y
 * écrire depuis ce seed, les deux mondes sont séparés (voir
 * progress-storage.ts). Ce seed peut donc sembler incohérent avec ce que
 * Modules/Accueil/Parcours affichent en test manuel.
 */
export function getApprenantModuleProgressSeed(): ApprenantModuleProgressEntry[] {
    const now = Date.now()
    const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString()

    return [
        // cm-3 (mv-3, assignation individuelle asg-1)
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-3",
            niveauId: "mv3-n1",
            isDone: true,
            bestScore: 1,
            maxScore: 1,
            passed: true,
            totalAttemptsCount: 1,
            wasCleanPass: true,
            firstCompletedAt: daysAgo(20),
            lastActivityAt: daysAgo(20),
        timeSpentMs: 480000,
        },
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-3",
            niveauId: "mv3-n2",
            isDone: true,
            bestScore: 0.25,
            maxScore: 1,
            passed: false,
            totalAttemptsCount: 1,
            wasCleanPass: false,
            firstCompletedAt: daysAgo(1),
            lastActivityAt: daysAgo(1),
        timeSpentMs: 360000,
        },
        // cm-2 (mv-2, assignation individuelle asg-3) — module entier parfait
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-2",
            niveauId: "mv2-n1",
            isDone: true,
            bestScore: 1,
            maxScore: 1,
            passed: true,
            totalAttemptsCount: 1,
            wasCleanPass: true,
            firstCompletedAt: daysAgo(18),
            lastActivityAt: daysAgo(18),
        timeSpentMs: 480000,
        },
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-2",
            niveauId: "mv2-n2",
            isDone: true,
            bestScore: 1,
            maxScore: 1,
            passed: true,
            totalAttemptsCount: 2,
            wasCleanPass: false,
            firstCompletedAt: daysAgo(10),
            lastActivityAt: daysAgo(10),
        timeSpentMs: 600000,
        },
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-2",
            niveauId: "mv2-n3",
            isDone: true,
            bestScore: 1,
            maxScore: 1,
            passed: true,
            totalAttemptsCount: 1,
            wasCleanPass: true,
            firstCompletedAt: daysAgo(5),
            lastActivityAt: daysAgo(5),
        timeSpentMs: 360000,
        },
        // cm-8 (mv-12, assignation de groupe asg-2, via grp-hotel-boreal)
        {
            userId: "usr-marie-lariviere",
            moduleId: "cm-8",
            niveauId: "mv12-n1",
            isDone: true,
            bestScore: 1,
            maxScore: 1,
            passed: true,
            totalAttemptsCount: 1,
            wasCleanPass: true,
            firstCompletedAt: daysAgo(16),
            lastActivityAt: daysAgo(16),
        timeSpentMs: 300000,
        },
    ]
}