/**
 * Miroir serveur de NiveauAttemptLogEntry (hooks/useNiveauProgress.ts),
 * qui vit dans localStorage — un formateur/gestionnaire consultant le
 * dossier d'un AUTRE apprenant n'a jamais accès à son localStorage, donc
 * jamais accès à son journal de tentatives sans cette contrepartie
 * serveur. Alimenté au même moment que la version locale (voir restart(),
 * useNiveauProgress.ts) — un événement, jamais recalculé après coup,
 * comme les moments forts (voir types/apprenantMomentFort.ts).
 */
export interface ApprenantNiveauAttempt {
    id: string
    userId: string
    moduleId: string
    niveauId: string
    /** Dénormalisé — évite un lookup de contenu pour afficher "Activité X" dans le dossier, le contenu peut avoir changé depuis */
    niveauTitle: string
    moduleTitle: string
    /** Numéro global de la tentative — même sémantique que NiveauAttemptLogEntry.attemptNumber côté client */
    attemptNumber: number
    score: number
    maxScore: number
    timeSpentMs: number
    completedAt: string
}
