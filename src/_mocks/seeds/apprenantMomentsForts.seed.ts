import type { ApprenantMomentFortEntry } from "@/types/apprenantMomentFort"

/**
 * Données pures, aucune dépendance vers apprenantMomentsForts.mock.ts —
 * mêmes raisons que apprenantModuleProgress.seed.ts.
 *
 * Correspond exactement au scénario de apprenantModuleProgress.seed.ts
 * pour usr-marie-lariviere — chaque entrée reflète ce que
 * upsertNiveauProgress (via lib/momentsFortsDetection.ts) aurait vraiment
 * détecté à chaque étape de cette chronologie, pas des dates inventées au
 * hasard. Module parfait (cm-2) et rattrapage réussi ne sont
 * volontairement pas ici : les deux se dérivent à l'affichage (voir
 * lib/momentsFortsDetection.ts, ReussitesView.tsx), jamais enregistrés
 * comme événements.
 */
export function getApprenantMomentsFortsSeed(): ApprenantMomentFortEntry[] {
    const now = Date.now()
    const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString()

    return [
        {
            id: "moment-seed-1",
            userId: "usr-marie-lariviere",
            momentKey: "premier-pas",
            moduleId: "cm-3",
            niveauId: "mv3-n1",
            earnedAt: daysAgo(20),
        },
        {
            id: "moment-seed-2",
            userId: "usr-marie-lariviere",
            momentKey: "score-parfait",
            moduleId: "cm-3",
            niveauId: "mv3-n1",
            earnedAt: daysAgo(20),
        },
        {
            id: "moment-seed-3",
            userId: "usr-marie-lariviere",
            momentKey: "score-parfait",
            moduleId: "cm-2",
            niveauId: "mv2-n1",
            earnedAt: daysAgo(18),
        },
        {
            id: "moment-seed-4",
            userId: "usr-marie-lariviere",
            momentKey: "score-parfait",
            moduleId: "cm-8",
            niveauId: "mv12-n1",
            earnedAt: daysAgo(16),
        },
        {
            id: "moment-seed-5",
            userId: "usr-marie-lariviere",
            momentKey: "serie-reussites",
            moduleId: "cm-8",
            niveauId: "mv12-n1",
            earnedAt: daysAgo(16),
        },
        {
            id: "moment-seed-6",
            userId: "usr-marie-lariviere",
            momentKey: "perseverance",
            moduleId: "cm-2",
            niveauId: "mv2-n2",
            earnedAt: daysAgo(10),
        },
        {
            id: "moment-seed-7",
            userId: "usr-marie-lariviere",
            momentKey: "score-parfait",
            moduleId: "cm-2",
            niveauId: "mv2-n3",
            earnedAt: daysAgo(5),
        },
        {
            id: "moment-seed-8",
            userId: "usr-marie-lariviere",
            momentKey: "retour-apres-pause",
            moduleId: "cm-3",
            niveauId: "mv3-n2",
            earnedAt: daysAgo(1),
        },
    ]
}
