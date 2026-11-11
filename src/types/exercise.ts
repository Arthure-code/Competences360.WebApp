// ---------------------------------------------------------------------------
// Média — transversal, pas un type d'exercice. Attachable à la question
// (ExerciseBase.media) et/ou à chaque option individuelle (LabeledOption.media).
// ---------------------------------------------------------------------------

export interface MediaAttachment {
    type: "image" | "video" | "audio"
    url: string
    /** Requis en pratique pour une image (accessibilité, synthèse vocale) */
    alt?: string
    caption?: string
}

/**
 * Option réutilisée par QCM, Ordre et Association plutôt que de redéfinir
 * {id, label} dans chaque interface.
 */
export interface LabeledOption {
    id: string
    label: string
    media?: MediaAttachment
}

// ---------------------------------------------------------------------------
// Exercices — une entrée de l'union par type. Ajouter un type d'exercice =
// ajouter une interface ici + une entrée dans l'union `Exercise`, sans toucher
// aux types existants. Chaque `config` est pensée comme la donnée qu'un
// formulaire formateur produirait pour ce type d'exercice.
// ---------------------------------------------------------------------------

interface ExerciseBase {
    id: string
    niveauId: string
    /**
     * Dénormalisé comme niveauId, mais OPTIONNEL contrairement à lui —
     * absent dans ModuleVersionContent (contenu auteur, voir
     * moduleVersions.mock.ts), posé seulement par buildStructuralModule
     * (lib/assignedModules.ts) au moment de résoudre une assignation.
     * L'auteur n'a jamais besoin d'y penser en créant du contenu. Sert à
     * useNiveauProgress pour savoir à quel module lier chaque score côté
     * serveur (voir apprenantModuleProgress.mock.ts), sans qu'aucun
     * appelant du hook n'ait besoin de le passer explicitement — même
     * principe que niveauId, déjà dérivé de la même façon.
     */
    moduleId?: string
    slug: string
    /** Position 1-based dans le niveau, pour l'affichage "Exercice X/N" */
    index: number
        /**
     * Titre court affiché dans le tableau de la page Bilan (ex. "Objet du
     * courriel"), rempli par le créateur de contenu. Optionnel : si absent,
     * l'UI retombe sur un repli générique ("Exercice N") plutôt que sur le
     * `prompt` complet, qui est souvent trop long pour une cellule de tableau.
     */
    title?: string
    prompt: string
    /** Illustration/support de la question, ex. une image à regarder avant de répondre */
    media?: MediaAttachment
    /** Affiché dans le panneau de correction une fois le résultat final connu */
    explanation?: string
    /** Affiché sur demande dans le panneau de correction tant que l'exercice n'est pas terminé */
    hint?: string
}

export interface QcmExercise extends ExerciseBase {
    type: "qcm"
    config: {
        choices: LabeledOption[]
        correctChoiceId: string
    }
}

export interface VraiFauxExercise extends ExerciseBase {
    type: "vrai_faux"
    config: {
        correctAnswer: boolean
    }
}

/**
 * Une phrase à trous est une séquence de segments — texte fixe ou trou à
 * remplir — plutôt qu'un seul champ, pour supporter nativement plusieurs
 * trous dans la même phrase. Chaque "blank" se rend comme un champ de
 * saisie inline, à la place du trou.
 */
export type ReponseCourteSegment =
    | { type: "text"; content: string }
    | { type: "blank"; id: string; acceptedAnswers: string[] }

export interface ReponseCourteExercise extends ExerciseBase {
    type: "reponse_courte"
    config: {
        segments: ReponseCourteSegment[]
    }
}

export interface QuestionNumeriqueExercise extends ExerciseBase {
    type: "question_numerique"
    config: {
        correctValue: number
        /** Marge acceptée de part et d'autre, ex. 0.5 */
        tolerance: number
        /** Suffixe affiché, ex. "$", "%", "min" */
        unit?: string
    }
}

/**
 * Une image, une ou plusieurs zones cliquables dessus (hotspots), une seule
 * bonne zone. Coordonnées en % de l'image (0-100), pas en pixels, pour
 * rester correct peu importe la taille d'affichage.
 */
export interface ZoneCliquableExercise extends ExerciseBase {
    type: "zone_cliquable"
    config: {
        image: MediaAttachment
        zones: { id: string; x: number; y: number; width: number; height: number; isCorrect: boolean }[]
    }
}

// ---------------------------------------------------------------------------
// Zone à remplir — variante de Zone cliquable : même mécanisme de
// positionnement sur une image (coordonnées en %, dessin clic-glisser),
// mais chaque zone devient un CHAMP TEXTE à remplir plutôt qu'un bouton à
// cliquer. Type SÉPARÉ, pas une modification de ZoneCliquableExercise —
// voir la discussion : modifier isCorrect en place aurait cassé tous les
// exercices "zone cliquable" déjà créés.
// ---------------------------------------------------------------------------

/**
 * Chaque type gère AUTOMATIQUEMENT ce qui est pré-rempli à l'écran, ce que
 * l'apprenant peut taper, et comment la réponse est comparée à la bonne
 * réponse — le formateur choisit un type, jamais de formatage à la main.
 * "gabarit" couvre tout format non prévu par les autres types (codes de
 * référence, numéros de suivi...) : # = un chiffre, A = une lettre,
 * * = n'importe quel caractère, tout autre caractère du pattern
 * (tiret, slash...) est pré-rempli et non saisissable.
 */
export type ZoneRemplirFieldType =
    | { kind: "texte_libre" }
    | { kind: "nombre" }
    | { kind: "montant"; symbole: string; position: "avant" | "apres" }
    | { kind: "telephone" }
    | { kind: "code_postal" }
    | { kind: "date"; format: "jj/mm/aaaa" | "mm/jj/aaaa" | "aaaa-mm-jj" }
    | { kind: "courriel" }
    | { kind: "gabarit"; pattern: string }

export interface ZoneRemplirZone {
    id: string
    x: number
    y: number
    width: number
    height: number
    fieldType: ZoneRemplirFieldType
    expectedAnswer: string
    /** Facultatif — limite le nombre de caractères que l'apprenant peut taper, en plus de ce que le type impose déjà */
    maxLength?: number
    /**
     * TOUTE zone appartient à une grille, même une seule (1x1) — même
     * esprit qu'une cellule Excel appartient toujours à un tableau,
     * même un tableau d'une seule case. Les zones nées du même geste de
     * création partagent le même gridId, avec leur position gridRow/
     * gridCol à l'intérieur de ce groupe — ce qui permet, après coup, de
     * reconfigurer toute une colonne/ligne ou de supprimer la grille
     * entière d'un seul geste, plutôt que de traiter chaque cellule comme
     * si elle n'avait jamais eu de lien avec les autres.
     */
    gridId: string
    gridRow: number
    gridCol: number
    /**
     * Un seul axe à la fois pour la configuration par pastille — jamais les
     * deux en même temps (même grille = même choix pour toutes ses
     * cellules). "col" = pastilles sur la rangée du haut, une par colonne.
     * "row" = pastilles sur la colonne de gauche, une par ligne. Doit
     * survivre à une sauvegarde/réouverture, d'où sur la zone elle-même
     * plutôt qu'un simple état de composant.
     */
    gridAxis: "col" | "row"
}

export interface ZoneRemplirExercise extends ExerciseBase {
    type: "zone_remplir"
    config: {
        image: MediaAttachment
        zones: ZoneRemplirZone[]
    }
}

export interface OrdreExercise extends ExerciseBase {
    type: "ordre"
    config: {
        items: LabeledOption[]
        /** Ids de `items`, dans l'ordre attendu */
        correctOrder: string[]
    }
}

export interface AssociationExercise extends ExerciseBase {
    type: "association"
    config: {
        /** Colonne de gauche, fixe (les emplacements à remplir) */
        targets: LabeledOption[]
        /** Banque à glisser */
        options: LabeledOption[]
        /** targetId -> optionId correct */
        correctMap: Record<string, string>
    }
}

/**
 * Un graphe de segments vidéo. Chaque node peut avoir des points de
 * décision — un moment où la vidéo se met en pause et affiche des choix,
 * chaque choix menant à un autre node. Un node sans point de décision est
 * une fin de parcours.
 *
 * Chaque choix porte `isCorrect` — il y a de bonnes et de mauvaises
 * décisions à chaque point de choix, pas juste des embranchements
 * neutres. La réussite de l'exercice dépend de la validité de CHAQUE choix
 * emprunté sur le chemin (voir checkExerciseAnswer dans
 * lib/exercise-validation.ts) — un seul mauvais choix rend l'exercice
 * échoué dans son ensemble, même si les choix suivants étaient bons.
 */
export interface VideoInteractiveExercise extends ExerciseBase {
    type: "video_interactive"
    config: {
        nodes: {
            id: string
            video: MediaAttachment
            decisionPoints: {
                timestampSeconds: number
                choices: { id: string; label: string; nextNodeId: string; isCorrect: boolean }[]
            }[]
        }[]
        startNodeId: string
    }
}

export type Exercise =
    | QcmExercise
    | VraiFauxExercise
    | ReponseCourteExercise
    | QuestionNumeriqueExercise
    | ZoneCliquableExercise
    | ZoneRemplirExercise
    | OrdreExercise
    | AssociationExercise
    | VideoInteractiveExercise

export type ExerciseKind = Exercise["type"]