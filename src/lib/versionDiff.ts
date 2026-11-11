import type { ModuleVersion, ModuleVersionContent } from "@/types/moduleVersion"

/**
 * Comparateur structurel (par id), pas un vrai diff textuel ligne par
 * ligne — suffisant pour un résumé lisible ("2 activités ajoutées, 1
 * exercice modifié") sans le coût d'un vrai moteur de diff. Calculé à
 * l'affichage, jamais stocké — reste toujours exact même si le contenu
 * change après coup.
 */
export function summarizeContentDiff(
    oldContent: ModuleVersionContent | null,
    newContent: ModuleVersionContent
): string {
    if (!oldContent) return "Version initiale"

    const oldNiveauIds = new Set(oldContent.niveaux.map((n) => n.id))
    const newNiveauIds = new Set(newContent.niveaux.map((n) => n.id))

    const addedNiveaux = newContent.niveaux.filter((n) => !oldNiveauIds.has(n.id)).length
    const removedNiveaux = oldContent.niveaux.filter((n) => !newNiveauIds.has(n.id)).length

    let addedExercises = 0
    let removedExercises = 0
    let modifiedExercises = 0

    for (const newNiveau of newContent.niveaux) {
        const oldNiveau = oldContent.niveaux.find((n) => n.id === newNiveau.id)
        if (!oldNiveau) continue // activité toute neuve, déjà comptée dans addedNiveaux

        const oldExerciseIds = new Set(oldNiveau.exercises.map((e) => e.id))
        const newExerciseIds = new Set(newNiveau.exercises.map((e) => e.id))

        addedExercises += newNiveau.exercises.filter((e) => !oldExerciseIds.has(e.id)).length
        removedExercises += oldNiveau.exercises.filter((e) => !newExerciseIds.has(e.id)).length

        for (const newExercise of newNiveau.exercises) {
            const oldExercise = oldNiveau.exercises.find((e) => e.id === newExercise.id)
            if (oldExercise && JSON.stringify(oldExercise) !== JSON.stringify(newExercise)) {
                modifiedExercises++
            }
        }
    }

    const titleChanged = oldContent.title !== newContent.title
    const descriptionChanged = oldContent.description !== newContent.description

    const parts: string[] = []
    if (addedNiveaux > 0) parts.push(`${addedNiveaux} activité${addedNiveaux > 1 ? "s" : ""} ajoutée${addedNiveaux > 1 ? "s" : ""}`)
    if (removedNiveaux > 0) parts.push(`${removedNiveaux} activité${removedNiveaux > 1 ? "s" : ""} retirée${removedNiveaux > 1 ? "s" : ""}`)
    if (addedExercises > 0) parts.push(`${addedExercises} exercice${addedExercises > 1 ? "s" : ""} ajouté${addedExercises > 1 ? "s" : ""}`)
    if (removedExercises > 0) parts.push(`${removedExercises} exercice${removedExercises > 1 ? "s" : ""} retiré${removedExercises > 1 ? "s" : ""}`)
    if (modifiedExercises > 0) parts.push(`${modifiedExercises} exercice${modifiedExercises > 1 ? "s" : ""} modifié${modifiedExercises > 1 ? "s" : ""}`)
    if (titleChanged) parts.push("titre modifié")
    if (descriptionChanged) parts.push("description modifiée")

    return parts.length > 0 ? parts.join(", ") : "Aucun changement de contenu"
}

/** Résout la version précédente (previousVersionId) et compare — le résumé affiché sur chaque item d'historique. */
export async function getChangeSummary(
    version: ModuleVersion,
    getVersionById: (id: string) => Promise<ModuleVersion | undefined>
): Promise<string> {
    if (!version.previousVersionId) return "Version initiale"
    const previous = await getVersionById(version.previousVersionId)
    return summarizeContentDiff(previous?.content ?? null, version.content)
}
