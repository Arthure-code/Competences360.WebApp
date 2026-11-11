import type { AssignmentStatus } from "@/components/shared/AssignmentStatusBadge"
import type { Exercise } from "./exercise"
import { ExternalLink } from "./externalLink"

export type Difficulty = "novice" | "intermediaire" | "expert"

// ---------------------------------------------------------------------------
// Niveaux
// ---------------------------------------------------------------------------

export interface NiveauIntro {
    description: string
    /** Puces de "Ce que vous allez pratiquer" */
    practiceItems: string[]
    exerciseCount: number
    durationMinutes: number
    /** null tant que le niveau n'a jamais été tenté (affiché "- /10") */
    currentScore: number | null
    maxScore: number
}

export interface Niveau {
    id: string
    moduleId: string
    /**
     * Dérivé de `index` ("niveau-1", "niveau-2"...) — c'est cette valeur qui
     * apparaît dans l'URL, pas `id`. Contrairement au slug d'un Module (dérivé
     * du titre), celui-ci est purement positionnel : l'ordre des niveaux dans
     * un module est fixe et séquentiel, pas besoin de slugify/generateUniqueSlug.
     */
    slug: string
    /** Position 1-based dans le module, pour "Niveau 3" */
    index: number
    title: string
    subtitle: string
    difficulty: Difficulty
    /** Étiquette optionnelle affichée à côté du titre, ex. "Vidéo Interactive" */
    badge?: string
    progressPercent: number
    status: AssignmentStatus
    /** true si le niveau précédent n'est pas encore complété */
    locked: boolean
    intro: NiveauIntro
    exercises: Exercise[]
    /**
     * Index (0-based) du dernier exercice atteint par l'apprenant dans
     * `exercises`, null s'il n'a jamais commencé. Provisoire : vit ici sur
     * le contenu du niveau en attendant le vrai tracking par apprenant
     * (voir lib/progress.ts) — le ExercisePlayer le remplacera par une
     * vraie table de progression, pas un champ sur le contenu.
     */
    lastExerciseIndex: number | null
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export interface Module {
    /** Clé stable et immuable — jamais utilisée dans l'URL, jamais recalculée */
    id: string
    /**
     * Dérivé du titre à la création, garanti unique (voir lib/slug.ts).
     * C'est cette valeur qui apparaît dans l'URL — pas `id`. Ne change pas
     * si le titre est renommé plus tard, pour ne jamais casser un lien
     * déjà partagé.
     */
    slug: string
    /**
     * Id d'une Category (types/category.ts) — plus une union fermée : une
     * catégorie peut désormais venir du mock global ou, plus tard, d'une
     * org. La résolution icône/couleur se fait par lookup, pas par switch.
     */
    categoryId: string
    title: string
    description: string
    status: AssignmentStatus
    /** Assigné par un formateur/groupe — sert au filtre "Assignés" du catalogue */
    assigned: boolean
    progressPercent: number
    /** Remplace le libellé "Progression" par ex. "Date limite dépassée" quand en retard */
    progressLabelOverride?: string
    niveaux: Niveau[]
    /** Ressources externes du module, affichées sous la section Activités — voir types/externalLink.ts */
    externalLinks: ExternalLink[]
}