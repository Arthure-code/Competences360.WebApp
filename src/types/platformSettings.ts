/**
 * Un seul enregistrement, pas une table — la plateforme n'a qu'une seule
 * configuration active à la fois. Poignée de champs NOMMÉS
 * volontairement (pas un système générique "n'importe quel paramètre") —
 * voir la discussion sur le rôle Admin : construire un vrai système de
 * config extensible serait un chantier à part entière, ce qu'on veut
 * éviter pour la phase 1.
 */
export interface PlatformSettings {
    /**
     * Jours de rétention dans la corbeille avant suppression définitive
     * (épopée 4). Valeur de départ alignée sur TRASH_RETENTION_DAYS
     * (lib/contentTrash.ts) — à confirmer/ajuster, ce fichier n'a pas été
     * revérifié dans cette session.
     */
    trashRetentionDays: number
    /**
     * Seuil de réussite d'une activité, en % — utilisé par
     * isNiveauPassed. Valeur de départ 60%, alignée sur ce qui a été
     * mentionné ailleurs dans le projet (weakSpots du dossier apprenant)
     * — à confirmer/ajuster, pas revérifié dans cette session.
     */
    niveauPassThresholdPercent: number
    /**
     * Jours d'inactivité avant qu'un groupe/apprenant soit signalé comme
     * "stagnant" côté gestionnaire. Valeur de départ estimée, jamais
     * confirmée dans cette session — à ajuster.
     */
    inactivityThresholdDays: number
}
