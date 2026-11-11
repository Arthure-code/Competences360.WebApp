import type { Exercise, ExerciseKind } from "@/types/exercise"

/**
 * Libellé du badge affiché en haut de chaque exercice (ex. "Choix de
 * réponse", "Vrai ou faux"). Un type d'exercice sans entrée ici afficherait
 * "undefined" — TypeScript nous force à combler ce Record en entier dès
 * qu'un type est ajouté à l'union Exercise.
 *
 * "ordre" et "association" utilisent tous deux un mécanisme de
 * glisser-déposer, mais afficher le même badge sur les deux prêtait à
 * confusion — l'apprenant ne pouvait pas deviner à quoi s'attendre avant
 * de voir l'exercice.
 */
export const EXERCISE_TAG_LABELS: Record<ExerciseKind, string> = {
    qcm: "Choix de réponse",
    vrai_faux: "Vrai ou faux",
    reponse_courte: "Réponse courte",
    question_numerique: "Question numérique",
    zone_cliquable: "Zone cliquable",
    zone_remplir: "Zone à remplir",
    ordre: "Mettre en ordre",
    association: "Glisser-déposer",
    video_interactive: "Vidéo interactive",
}

const TITLE_FALLBACK_MAX_LENGTH = 40

/**
 * Titre court d'un exercice pour les endroits à espace limité (colonne
 * "Exercice" du tableau de la page Bilan). Utilise ExerciseBase.title s'il
 * est rempli par le créateur de contenu ; sinon retombe sur le prompt
 * tronqué plutôt qu'un générique "Exercice N", pour rester lisible même
 * sans titre dédié.
 */
export function getExerciseDisplayTitle(exercise: Exercise): string {
    if (exercise.title) return exercise.title
    if (exercise.prompt.length <= TITLE_FALLBACK_MAX_LENGTH) return exercise.prompt
    return `${exercise.prompt.slice(0, TITLE_FALLBACK_MAX_LENGTH).trimEnd()}…`
}