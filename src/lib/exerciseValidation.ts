import type { Exercise, ExerciseKind } from "@/types/exercise"
import { isZoneRemplirAnswerCorrect } from "./zoneRemplirFieldTypes"

// ---------------------------------------------------------------------------
// APERÇU FORMATEUR UNIQUEMENT.
//
// La correction du parcours apprenant a quitté le navigateur : elle est
// rendue par POST /api/apprentissage/exercices/cle/{key}/repondre, et le
// catalogue servi à l'apprenant ne porte PLUS les champs de solution
// (ExerciseConfigSanitizer côté API). Appeler checkExerciseAnswer sur un
// exercice du catalogue rendrait donc « faux » quoi qu'on réponde.
//
// Ce qui reste ici sert au mode test de l'éditeur (TestModeRenderer), où le
// formateur travaille sur SON contenu, solutions comprises, sur un exercice
// qui n'a pas à être noté ni journalisé. C'est le seul endroit où le
// navigateur connaît légitimement la réponse.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Forme de la réponse soumise par l'apprenant, une entrée par type
// d'exercice — le pendant "réponse" du modèle "contenu" de exercice.ts.
// ---------------------------------------------------------------------------

export type ExerciseAnswer =
    | { type: "qcm"; choiceId: string }
    | { type: "vrai_faux"; value: boolean }
    | { type: "reponse_courte"; values: Record<string, string> }
    | { type: "question_numerique"; value: number }
    | { type: "zone_cliquable"; zoneId: string }
    /** Une valeur par zone (id -> texte tapé par l'apprenant), même forme que reponse_courte */
    | { type: "zone_remplir"; values: Record<string, string> }
    | { type: "ordre"; order: string[] }
    | { type: "association"; map: Record<string, string> }
    | {
          type: "video_interactive"
          endNodeId: string
          /** Chaque choix emprunté, dans l'ordre — nécessaire pour valider rétroactivement lesquels étaient corrects (voir checkExerciseAnswer) */
          path: { nodeId: string; decisionPointIndex: number; choiceId: string }[]
      }

/** Comparaison insensible à la casse/accents, comme précisé dans EXERCISE_TYPES.md */
function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Checker = (exercise: any, answer: ExerciseAnswer) => boolean

/**
 * Une fonction de correction par type d'exercice. Ajouter un type =
 * ajouter une entrée ici, sans toucher aux autres — même principe que le
 * registre des renderers.
 */
const CHECKERS: Record<ExerciseKind, Checker> = {
    qcm: (exercise, answer) =>
        answer.type === "qcm" && answer.choiceId === exercise.config.correctChoiceId,

    vrai_faux: (exercise, answer) =>
        answer.type === "vrai_faux" && answer.value === exercise.config.correctAnswer,

    reponse_courte: (exercise, answer) => {
        if (answer.type !== "reponse_courte") return false
        return exercise.config.segments
            .filter((segment: { type: string }) => segment.type === "blank")
            .every((blank: { id: string; acceptedAnswers: string[] }) => {
                const given = normalize(answer.values[blank.id] ?? "")
                return blank.acceptedAnswers.some((accepted) => normalize(accepted) === given)
            })
    },

    question_numerique: (exercise, answer) =>
        answer.type === "question_numerique" &&
        Math.abs(answer.value - exercise.config.correctValue) <= exercise.config.tolerance,

    zone_cliquable: (exercise, answer) =>
        answer.type === "zone_cliquable" &&
        exercise.config.zones.find((zone: { id: string }) => zone.id === answer.zoneId)?.isCorrect === true,

    // Chaque zone est comparée avec sa propre logique de type (voir
    // isZoneRemplirAnswerCorrect, lib/zoneRemplirFieldTypes.ts) — un
    // montant tolère virgule/point, un texte libre ignore casse/espaces,
    // etc. Réussi seulement si TOUTES les zones sont correctes.
    zone_remplir: (exercise, answer) => {
        if (answer.type !== "zone_remplir") return false
        return exercise.config.zones.every((zone: { id: string; fieldType: import("@/types/exercise").ZoneRemplirFieldType; expectedAnswer: string }) =>
            isZoneRemplirAnswerCorrect(zone.fieldType, answer.values[zone.id] ?? "", zone.expectedAnswer)
        )
    },

    ordre: (exercise, answer) =>
        answer.type === "ordre" &&
        answer.order.length === exercise.config.correctOrder.length &&
        answer.order.every((id, i) => id === exercise.config.correctOrder[i]),

    association: (exercise, answer) =>
        answer.type === "association" &&
        Object.entries(exercise.config.correctMap).every(
            ([targetId, optionId]) => answer.map[targetId] === optionId
        ),

    // Réussi seulement si CHAQUE choix emprunté sur le chemin était
    // marqué isCorrect — un seul mauvais choix, même suivi de bons choix,
    // rend l'exercice échoué. Design assumé : pas de "récupération"
    // possible après un mauvais choix initial (à revoir si besoin).
    video_interactive: (exercise, answer) => {
        if (answer.type !== "video_interactive") return false
        return answer.path.every((step) => {
            const node = exercise.config.nodes.find((n: { id: string }) => n.id === step.nodeId)
            const decisionPoint = node?.decisionPoints[step.decisionPointIndex]
            const choice = decisionPoint?.choices.find((c: { id: string }) => c.id === step.choiceId)
            return choice?.isCorrect === true
        })
    },
}

export function checkExerciseAnswer(exercise: Exercise, answer: ExerciseAnswer): boolean {
    return CHECKERS[exercise.type](exercise, answer)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SolutionBuilder = (exercise: any) => ExerciseAnswer | null

/**
 * La solution exprimée DANS LA FORME D'UNE RÉPONSE D'APPRENANT — même
 * contrat que `bonneReponse` rendu par l'API (voir ExerciseSolutionDescriber),
 * pour que CorrectionPanel n'ait qu'un seul chemin d'affichage, qu'il
 * s'agisse du verdict du serveur ou de l'aperçu formateur.
 */
const SOLUTIONS: Record<ExerciseKind, SolutionBuilder> = {
    qcm: (exercise) => ({ type: "qcm", choiceId: exercise.config.correctChoiceId }),

    vrai_faux: (exercise) => ({ type: "vrai_faux", value: exercise.config.correctAnswer }),

    // La PREMIÈRE réponse acceptée fait référence ; les suivantes sont des
    // variantes tolérées, pas des propositions à afficher.
    reponse_courte: (exercise) => ({
        type: "reponse_courte",
        values: Object.fromEntries(
            exercise.config.segments
                .filter((segment: { type: string }) => segment.type === "blank")
                .map((blank: { id: string; acceptedAnswers: string[] }) => [
                    blank.id,
                    blank.acceptedAnswers[0] ?? "",
                ])
        ),
    }),

    question_numerique: (exercise) => ({
        type: "question_numerique",
        value: exercise.config.correctValue,
    }),

    zone_cliquable: (exercise) => {
        const zone = exercise.config.zones.find((z: { isCorrect: boolean }) => z.isCorrect)
        return zone ? { type: "zone_cliquable", zoneId: zone.id } : null
    },

    zone_remplir: (exercise) => ({
        type: "zone_remplir",
        values: Object.fromEntries(
            exercise.config.zones.map((zone: { id: string; expectedAnswer: string }) => [zone.id, zone.expectedAnswer])
        ),
    }),

    ordre: (exercise) => ({ type: "ordre", order: exercise.config.correctOrder }),

    association: (exercise) => ({ type: "association", map: exercise.config.correctMap }),

    // Pas de « bonne réponse » unique pour un parcours exploratoire —
    // CorrectionPanel masque entièrement cette ligne pour ce type.
    video_interactive: () => null,
}

export function solutionAsAnswer(exercise: Exercise): ExerciseAnswer | null {
    return SOLUTIONS[exercise.type](exercise)
}