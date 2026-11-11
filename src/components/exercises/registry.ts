import type { ComponentType } from "react"
import type { Exercise, ExerciseKind } from "@/types/exercise"
import type { ExerciseAnswer } from "@/lib/exerciseValidation"
import QcmRenderer from "./QcmRenderer"
import VraiFauxRenderer from "./VraiFauxRenderer"
import ReponseCourteRenderer from "./ReponseCourteRenderer"
import QuestionNumeriqueRenderer from "./QuestionNumeriqueRenderer"
import ZoneCliquableRenderer from "./ZoneCliquableRenderer"
import ZoneRemplirRenderer from "./ZoneRemplirRenderer"
import OrdreRenderer from "./OrdreRenderer"
import AssociationRenderer from "./AssociationRenderer"
import VideoInteractiveRenderer from "./VideoInteractiveRenderer"

export interface ExerciseRendererProps<E extends Exercise = Exercise> {
    exercise: E
    /** Dernière réponse soumise pour cet exercice — permet de ré-afficher un essai précédent */
    lastAnswer: ExerciseAnswer | null
    /** true une fois l'exercice verrouillé (résultat final) — le renderer bascule alors en lecture seule */
    isLocked: boolean
    /**
     * Brouillon non soumis (choix fait, pas encore validé), remonté dans
     * useNiveauProgress plutôt que gardé en useState local — survit à la
     * navigation entre exercices via le stepper. Forme libre par type
     * (string pour un id choisi, Record<string,string> pour une carte
     * d'association, etc.) : chaque renderer connaît la sienne.
     */
    draft: unknown
    onDraftChange: (value: unknown) => void
    onSubmit: (answer: ExerciseAnswer) => void
    /**
     * La bonne réponse, pour colorer la correction DANS l'exercice une fois
     * verrouillé — le bon choix en vert, le mauvais en rouge.
     *
     * Elle vient du SERVEUR (`bonneReponse`, rendu à la finalisation) et non
     * de `exercise.config`, qui ne porte plus de solution : la lire là
     * faisait planter le rendu, ou pire, ne rien colorer du tout. Même forme
     * qu'une réponse d'apprenant, exprès — le renderer sait déjà la lire.
     *
     * null tant que l'exercice n'est pas terminé : à ce moment-là il n'y a
     * rien à colorer, et le client n'a pas à connaître la réponse.
     */
    solution?: ExerciseAnswer | null
}

/**
 * Un composant de rendu par type d'exercice. Ajouter un type d'exercice =
 * ajouter une interface dans types/exercice.ts + un cas dans
 * lib/exercise-validation.ts + une entrée ici — jamais de switch central
 * dans le player lui-même.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EXERCISE_RENDERERS: Partial<Record<ExerciseKind, ComponentType<ExerciseRendererProps<any>>>> = {
    qcm: QcmRenderer,
    vrai_faux: VraiFauxRenderer,
    reponse_courte: ReponseCourteRenderer,
    question_numerique: QuestionNumeriqueRenderer,
    zone_cliquable: ZoneCliquableRenderer,
    zone_remplir: ZoneRemplirRenderer,
    ordre: OrdreRenderer,
    association: AssociationRenderer,
    video_interactive: VideoInteractiveRenderer,
}