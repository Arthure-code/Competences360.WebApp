import type {
    Exercise,
    ExerciseKind,
    QcmExercise,
    VraiFauxExercise,
    ReponseCourteExercise,
    QuestionNumeriqueExercise,
    ZoneCliquableExercise,
    OrdreExercise,
    AssociationExercise,
    VideoInteractiveExercise,
} from "@/types/exercise"
import type { ExerciseAnswer } from "./exerciseValidation"

interface FeedbackContext {
    isSuccess: boolean
    isRevealed: boolean
    attemptsCount: number
}

/**
 * Titres/sous-titres génériques du panneau de correction, indépendants du
 * type d'exercice — centralisés ici plutôt que dispersés dans les
 * composants, pour rester faciles à réviser (ton, formulation) sans
 * toucher au rendu. Voir "Correction et feedback" dans EXERCISE_TYPES.md.
 */
export function getFeedbackCopy({ isSuccess, isRevealed, attemptsCount }: FeedbackContext): {
    title: string
    subtitle?: string
} {
    if (isSuccess) {
        return {
            title: "Bonne réponse !",
            subtitle: attemptsCount > 1 ? "Réussi après un nouvel essai." : undefined,
        }
    }
    if (isRevealed) {
        return { title: "Voici la bonne réponse", subtitle: "Cet exercice ne peut plus être modifié." }
    }
    if (attemptsCount >= 2) {
        return { title: "Pas encore, mais c'est normal.", subtitle: "Réessayez, ou consultez la réponse." }
    }
    return { title: "Pas tout à fait", subtitle: "Vous pouvez réessayer." }
}

// ---------------------------------------------------------------------------
// Formatage lisible de "la réponse de l'apprenant" / "la bonne réponse"
// pour le panneau de correction, par type d'exercice. Chaque entrée est
// ajoutée en même temps que le renderer correspondant — un type sans
// entrée retombe sur "—" plutôt que de planter.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnswerFormatter = (exercise: any, answer: ExerciseAnswer) => string

const ANSWER_FORMATTERS: Partial<Record<ExerciseKind, AnswerFormatter>> = {
    qcm: (exercise: QcmExercise, answer) => {
        if (answer.type !== "qcm") return "—"
        return exercise.config.choices.find((choice) => choice.id === answer.choiceId)?.label ?? "—"
    },
    vrai_faux: (_exercise: VraiFauxExercise, answer) => {
        if (answer.type !== "vrai_faux") return "—"
        return answer.value ? "Vrai" : "Faux"
    },
    reponse_courte: (exercise: ReponseCourteExercise, answer) => {
        if (answer.type !== "reponse_courte") return "—"
        return exercise.config.segments
            .map((segment) => (segment.type === "text" ? segment.content : answer.values[segment.id] || "…"))
            .map((part) => part.trim())
            .filter(Boolean)
            .join(" ")
    },
    question_numerique: (exercise: QuestionNumeriqueExercise, answer) => {
        if (answer.type !== "question_numerique") return "—"
        return `${answer.value}${exercise.config.unit ? ` ${exercise.config.unit}` : ""}`
    },
    zone_cliquable: (exercise: ZoneCliquableExercise, answer) => {
        if (answer.type !== "zone_cliquable") return "—"
        const index = exercise.config.zones.findIndex((zone) => zone.id === answer.zoneId)
        return index === -1 ? "—" : `Zone n°${index + 1}`
    },
    ordre: (exercise: OrdreExercise, answer) => {
        if (answer.type !== "ordre") return "—"
        const itemsById = Object.fromEntries(exercise.config.items.map((item) => [item.id, item]))
        return answer.order.map((id) => itemsById[id]?.label ?? "…").join(" → ")
    },
    association: (exercise: AssociationExercise, answer) => {
        if (answer.type !== "association") return "—"
        const optionsById = Object.fromEntries(exercise.config.options.map((option) => [option.id, option]))
        return exercise.config.targets
            .map((target) => `${target.label} : ${optionsById[answer.map[target.id]]?.label ?? "—"}`)
            .join(" ; ")
    },
    // Pas de "bonne" fin — la ligne "Votre réponse" décrit plutôt quelle
    // fin a été atteinte, via le texte alternatif du nœud (déjà présent
    // dans le contenu, pas de nouveau champ nécessaire).
    video_interactive: (exercise: VideoInteractiveExercise, answer) => {
        if (answer.type !== "video_interactive") return "—"
        const endNode = exercise.config.nodes.find((node) => node.id === answer.endNodeId)
        return endNode?.video.alt ?? "Parcours terminé"
    },
}

export function formatAnswerForDisplay(exercise: Exercise, answer: ExerciseAnswer): string {
    return ANSWER_FORMATTERS[exercise.type]?.(exercise, answer) ?? "—"
}

/**
 * La bonne réponse n'est plus DÉDUITE de la config : elle est rendue par le
 * serveur à la finalisation (voir ExerciseSolutionDescriber côté API), et le
 * catalogue ne porte plus les champs de solution. Aucun formateur de plus
 * n'est nécessaire — le serveur émet exprès la solution DANS LA FORME D'UNE
 * RÉPONSE D'APPRENANT, donc ceux ci-dessus savent déjà la rendre.
 *
 * Le discriminant `type` a été apposé en amont (useNiveauProgress), une seule
 * fois pour tous les consommateurs.
 */
export function formatCorrectAnswer(
    exercise: Exercise,
    bonneReponse: ExerciseAnswer | null | undefined,
): string {
    if (!bonneReponse) return "—"

    return ANSWER_FORMATTERS[exercise.type]?.(exercise, bonneReponse) ?? "—"
}