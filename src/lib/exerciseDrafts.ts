import type { Exercise, ExerciseKind } from "@/types/exercise"

/**
 * Config vierge valide par type — nécessaire pour créer un nouvel exercice
 * ET pour basculer le type d'un exercice existant (le config change de
 * forme d'un type à l'autre, ne peut jamais être simplement patché).
 */
export function createDefaultExerciseConfig(type: ExerciseKind): Exercise["config"] {
    switch (type) {
        case "qcm":
            return { choices: [], correctChoiceId: "" }
        case "vrai_faux":
            return { correctAnswer: true }
        case "reponse_courte":
            return { segments: [] }
        case "question_numerique":
            return { correctValue: 0, tolerance: 0 }
        case "zone_cliquable":
            return { image: { type: "image", url: "" }, zones: [] }
        case "zone_remplir":
            return { image: { type: "image", url: "" }, zones: [] }
        case "ordre":
            return { items: [], correctOrder: [] }
        case "association":
            return { targets: [], options: [], correctMap: {} }
        case "video_interactive":
            return { nodes: [], startNodeId: "" }
    }
}

interface CreateExerciseParams {
    id: string
    niveauId: string
    slug: string
    index: number
    type: ExerciseKind
}

export function createExercise(params: CreateExerciseParams): Exercise {
    const base = { id: params.id, niveauId: params.niveauId, slug: params.slug, index: params.index, prompt: "" }
    return { ...base, type: params.type, config: createDefaultExerciseConfig(params.type) } as Exercise
}

/** Bascule le type d'un exercice existant — garde les champs communs (prompt/hint/explanation/title), réinitialise `config`. */
export function changeExerciseType(exercise: Exercise, newType: ExerciseKind): Exercise {
    const { config: _oldConfig, type: _oldType, ...rest } = exercise
    return { ...rest, type: newType, config: createDefaultExerciseConfig(newType) } as Exercise
}