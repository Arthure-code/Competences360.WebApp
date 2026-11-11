export type MomentFortKey =
    | "premier-pas"
    | "score-parfait"
    | "perseverance"
    | "serie-reussites"
    | "module-parfait"
    | "retour-apres-pause"
    | "rattrapage-reussi"

/**
 * Un événement détecté une fois, jamais recalculé après coup — contrairement
 * à ApprenantModuleProgressEntry (état courant, écrasé à chaque mise à
 * jour), un moment fort capture une TRANSITION précise dans le temps
 * ("était inactif, vient de revenir" ; "avait échoué, vient de réussir").
 * Cette transition n'est pas déductible d'un simple instantané de l'état
 * final — elle doit être enregistrée au moment où elle se produit, dans
 * upsertNiveauProgress (apprenantModuleProgress.actions.ts), qui compare
 * l'ancien état au nouveau avant d'écraser.
 */
export interface ApprenantMomentFortEntry {
    id: string
    userId: string
    momentKey: MomentFortKey
    moduleId: string
    niveauId?: string
    earnedAt: string
}
