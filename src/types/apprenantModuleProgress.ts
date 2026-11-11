/**
 * Le lien apprenant ↔ module ↔ niveau qui manquait — jusqu'ici,
 * uniquement dans localStorage (voir progress-storage.ts), jamais visible
 * côté serveur, donc jamais utilisable pour Statistiques (filtre Module),
 * le dossier apprenant, "meilleurs apprenants", l'utilisation des
 * modules "par qui", ou les moments forts. Un enregistrement par
 * (apprenant, module, niveau).
 */
export interface ApprenantModuleProgressEntry {
    userId: string
    moduleId: string
    niveauId: string
    /** true une fois que chaque exercice du niveau a un résultat final — même critère que hasCompleted dans useNiveauProgress */
    isDone: boolean
    /** Meilleur score jamais obtenu, ne régresse jamais — même sémantique que NiveauProgressSnapshot.bestScore */
    bestScore: number | null
    maxScore: number
    /** score/maxScore >= NIVEAU_PASS_THRESHOLD_PERCENT (lib/scoring.ts) — additif, jamais un statut visible ailleurs pour l'instant */
    passed: boolean
    /** Nombre de fois que ce niveau a été recommencé (restart()) — sert à détecter la Persévérance (échoué puis réussi après un restart) */
    totalAttemptsCount: number
    /** true si, à la dernière complétion, chaque exercice a été réussi dès sa 1ère soumission — sert à détecter une série de réussites propres */
    wasCleanPass: boolean
    /**
     * Horodatage de la 1ère fois que isDone est passé à true — TEMPORAIRE :
     * peut être absent pour les niveaux déjà complétés avant l'ajout de ce
     * champ. Une fois posé, ne change jamais (contrairement à bestScore,
     * qui peut s'améliorer). Sert de vrai horodatage pour badges/
     * certificats/moments forts, contrairement à earnedAt qui était
     * absent avant cette entrée.
     */
    firstCompletedAt?: string
    /** Mis à jour à chaque sauvegarde, sert à "dernière activité par module précis", au retour après une pause (moments forts), et à la détection de contenu inutilisé (voir épopée 4, corbeille) */
    lastActivityAt: string
    /**
     * Temps actif cumulé sur CETTE activité (voir elapsedMs,
     * hooks/useNiveauProgress.ts) — n'existait nulle part côté serveur
     * avant, seulement dans localStorage, donc inaccessible à un
     * formateur/gestionnaire consultant le dossier d'un AUTRE apprenant.
     * Sert au "temps par activité"/"temps par module" du dossier complet
     * (épopée 17).
     */
    timeSpentMs: number
}