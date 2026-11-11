/**
 * computeNiveauProgress et computeModuleProgress (anciennement ici) ont
 * été retirées — jamais branchées (leur propre commentaire le disait), et
 * maintenant remplacées pour de vrai par hydrateModuleProgress
 * (lib/moduleProgress.ts), qui fait ce calcul depuis les vraies données.
 */

/**
 * Pourcentage global d'une catégorie = moyenne de la progression de ses
 * modules. Module.progressPercent existe déjà comme donnée réelle,
 * indépendamment de ce qui se passe au niveau des niveaux/exercices —
 * voir getCategoryStats dans lib/modules.ts.
 */
export function computeCategoryProgress(modulePercents: number[]): number {
    if (modulePercents.length === 0) return 0
    const sum = modulePercents.reduce((acc, p) => acc + p, 0)
    return Math.round(sum / modulePercents.length)
}

/**
 * "4h 35" + unité "min" séparée — pour StatCard, qui affiche l'unité en
 * plus petit après la valeur. En dessous d'une heure : juste "35" + "min",
 * pas "0h 35", pour rester lisible.
 */
export function formatDurationLabel(totalMs: number): { value: string; unit: string } {
    const totalMinutes = Math.round(totalMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) return { value: `${minutes}`, unit: "min" }
    return { value: `${hours}h ${minutes.toString().padStart(2, "0")}`, unit: "min" }
}


export function computeTotalScoreFromAttempts(
    attempts: Record<string, { score: number | null }>
): number {
    return Object.values(attempts).reduce((sum, attempt) => sum + (attempt.score ?? 0), 0)
}