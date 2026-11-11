import type { Exercise } from "./exercise"
import type { ExternalLink } from "./externalLink"

/** Seulement 2 valeurs, retrait de l'ancien 3e état ("active"/officiel). "Officiel" est maintenant un pointeur sur ContentModule, pas un statut de version. */
export type ModuleVersionStatus = "draft" | "published"

/**
 * Le contenu réel porté par une version, titre, description, catégorie,
 * activités. Volontairement PAS le même type que `Module`/`Niveau`
 * (utilisés côté apprenant) : ceux-là mélangent contenu auteur et état
 * d'exécution par apprenant (progressPercent, locked, status,
 * lastExerciseIndex). Un formateur qui écrit une activité ne doit jamais
 * voir/manipuler ces champs runtime.
 *
 * Progression toujours libre, jamais séquentielle.
 *
 * externalLinks — au niveau du MODULE entier, pas par activité (contrairement
 * à `niveaux`) : une liste de ressources externes affichée une seule fois,
 * sous la section Activités côté apprenant. Toujours initialisé à `[]`,
 * jamais absent, pour ne jamais faire planter un .map() sur du contenu
 * créé avant l'ajout de ce champ.
 */
export interface ModuleVersionContent {
    title: string
    description: string
    categoryId: string
    niveaux: NiveauDraft[]
    externalLinks: ExternalLink[]
}

/**
 * Contenu auteur d'une activité, pas d'état d'exécution
 * (progressPercent, locked, etc.). Le nom de type reste `NiveauDraft`/
 * `niveauId` en interne (utilisé dans des dizaines de fichiers apprenant
 * déjà fonctionnels), seul l'affichage utilisateur dit "Activité", jamais
 * le code.
 */
export interface NiveauDraft {
    id: string
    slug: string
    index: number
    title: string
    difficulty: "novice" | "intermediaire" | "expert"
    description: string
    practiceItems: string[]
    durationMinutes: number
    exercises: Exercise[]
}

/**
 * Une version de contenu créée/modifiée par un formateur ou un
 * gestionnaire, porte le contenu réel (`content`). Fork (nouvelle
 * version), jamais édition en place une fois que c'est la version
 * officielle de son module (voir ContentModule.officialVersionId).
 */
export interface ModuleVersion {
    id: string
    /** Le ContentModule auquel cette version appartient, toujours requis, chaque version appartient à exactement un module */
    moduleId: string
    /** Trace v1 -> v2 -> v3 au sein du même module, absent sur la toute première version d'un module */
    previousVersionId?: string
    organizationId: string
    status: ModuleVersionStatus
    /** Note optionnelle laissée par le créateur, le résumé principal est généré automatiquement (voir lib/versionDiff.ts), pas saisi. */
    changeNote?: string
    createdByUserId: string
    /** Dénormalisé, l'attribution reste lisible même si le compte est désactivé (voir isAccountActive) */
    createdByName: string
    createdAt: string
    content: ModuleVersionContent
    /**
     * Raison écrite par le gestionnaire au moment de renvoyer en
     * brouillon, un peu comme un message de commit, jamais coché, juste
     * du contexte (voir revertToDraft, moduleVersions.actions.ts). Absent
     * si cette version n'a jamais été renvoyée.
     */
    reviewReason?: string
    /** Qui a renvoyé, dénormalisé comme createdByName, pour afficher "Renvoyé par X" sans lookup supplémentaire */
    reviewedByName?: string
    /**
     * Posé quand le formateur resoumet après avoir traité tous les
     * commentaires (voir resubmitForReview, moduleVersions.actions.ts),
     * remis à null une fois le gestionnaire reparti (confirmé ou renvoyé
     * à nouveau). Distinct de ContentModule.hasBeenReviewedByGestionnaire,
     * qui ne redevient jamais faux une fois vrai, donc ne peut pas à lui
     * seul détecter un 2e tour de révision.
     */
    submittedForReviewAt?: string | null
}