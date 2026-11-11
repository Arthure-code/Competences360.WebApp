/** Longueurs maximales de saisie dans l'éditeur de contenu, appliquées par `maxLength`. */
export const CONTENT_TEXT_LIMITS = {
    /** Description du module (ModuleInfoPanel) */
    moduleDescription: 300,
    /** Description d'une activité (ActivityWorkspace) */
    activityDescription: 300,
    /** Indice d'un exercice (ExerciseHintExplanationEditor) */
    exerciseHint: 150,
    /** Explication d'un exercice (ExerciseHintExplanationEditor) */
    exerciseExplanation: 400,
    /** Énoncé d'un exercice, tous types confondus */
    exercisePrompt: 200,
    /** Segment de texte fixe dans une phrase à trous (ReponseCourteEditablePreview) */
    reponseCourteSegmentText: 50,
    /** Une réponse acceptée pour un trou (ReponseCourteEditablePreview) */
    reponseCourteBlankAnswer: 30,
    /** Texte d'un élément à réordonner (OrdreEditablePreview) */
    ordreItemLabel: 60,
    /** Texte d'une cible ou d'une option (AssociationEditablePreview) */
    associationLabel: 40,
    /** Un élément de « Ce que vous allez pratiquer » (ActivityWorkspace) */
    practiceItemText: 60,
} as const

/** Nombre maximal d'éléments dans « Ce que vous allez pratiquer ». */
export const MAX_PRACTICE_ITEMS = 5

/** Nombre maximal de zones cliquables par exercice. */
export const MAX_ZONES_CLIQUABLES = 10

/**
 * Zone à remplir a un vrai besoin différent de Zone cliquable — un
 * tableau réel (bon de commande, formulaire) peut facilement dépasser
 * 30 cellules (ex. 8 lignes x 4 colonnes). Pas une "vraie" limite
 * pratique, juste un plafond technique de sécurité pour éviter qu'une
 * grille démesurée (erreur de saisie dans lignes/colonnes) ne fige le
 * navigateur.
 */
export const MAX_ZONES_REMPLIR = 200

/**
 * Config réutilisable pour FileUploader (components/shared/FileUploader.tsx)
 * — même esprit qu'un "file router" UploadThing (types acceptés + poids
 * par type), pour que brancher un vrai service plus tard ne touche que ce
 * fichier, pas chaque appelant.
 */
export const UPLOAD_KIND_CONFIG = {
    image: { accept: "image/*" },
    video: { accept: "video/*" },
    audio: { accept: "audio/*" },
} as const

export type UploadKind = keyof typeof UPLOAD_KIND_CONFIG

/** Nombre maximal de choix pour un QCM. */
export const MAX_QCM_CHOICES = 6
