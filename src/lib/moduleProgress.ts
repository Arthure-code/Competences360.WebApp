import type { Module, Niveau } from "@/types/module"
import type { AssignmentStatus } from "@/components/shared/AssignmentStatusBadge"
import { apiProgressStorage, type NiveauProgressSnapshot } from "./progressStorage"

/**
 * Charge en UN aller-retour les instantanés de toutes les activités d'un
 * module — la lecture est devenue un appel réseau (voir
 * lib/progressStorage.ts), un module de six activités en enchaînerait six.
 */
async function chargerInstantanes(
    module: Module
): Promise<Record<string, NiveauProgressSnapshot>> {
    return await apiProgressStorage.loadMany(
        module.niveaux.map((niveau) => cleDeStockage(niveau))
    )
}

/**
 * Même dérivation que useNiveauProgress (hooks/useNiveauProgress.ts) —
 * exercises[0].niveauId, PAS niveau.id directement. Les deux devraient
 * toujours être identiques, mais rien ne le garantit structurellement ;
 * lire et écrire avec la même règle élimine tout risque de divergence,
 * peu importe le contenu.
 */
function cleDeStockage(niveau: Niveau): string {
    return niveau.exercises[0]?.niveauId ?? niveau.id
}

export interface ModuleProgressSummary {
    /** null => "-" (aucun niveau du module n'a encore de score) */
    averageScorePercent: number | null
    elapsedMs: number
}

function getNiveauScorePercent(niveau: Niveau, bestScore: number | null): number | null {
    // Un test de nullité laisse passer `undefined`, qui donnerait un NaN à la
    // division — voir useProgression.ts, même piège.
    if (typeof bestScore !== "number" || niveau.intro.maxScore === 0) return null
    return Math.round((bestScore / niveau.intro.maxScore) * 100)
}

/**
 * Lit les instantanés de progression (un par activité, voir
 * progressStorage.ts) de tous les niveaux d'un module et les agrège :
 * temps total passé, et moyenne des scores (%) des niveaux effectivement
 * tentés.
 *
 * Asynchrone depuis que la progression vit sur l'API — à invoquer dans un
 * useEffect, jamais au rendu.
 */
export async function getModuleProgressSummary(
    module: Module
): Promise<ModuleProgressSummary> {
    let elapsedMs = 0
    const scorePercents: number[] = []

    const instantanes = await chargerInstantanes(module)

    for (const niveau of module.niveaux) {
        const snapshot = instantanes[cleDeStockage(niveau)]
        if (!snapshot) continue

        elapsedMs += snapshot.elapsedMs

        const percent = getNiveauScorePercent(niveau, snapshot.bestScore)
        if (percent !== null) scorePercents.push(percent)
    }

    const averageScorePercent =
        scorePercents.length === 0
            ? null
            : Math.round(scorePercents.reduce((sum, p) => sum + p, 0) / scorePercents.length)

    return { averageScorePercent, elapsedMs }
}

/**
 * "1h 15min" / "45min" / "0min" — format compact pour une cellule de
 * tableau (contrairement à formatDurationLabel dans lib/progress.ts, qui
 * sépare valeur/unité pour StatCard).
 */
export function formatModuleTimeSpent(elapsedMs: number): string {
    const totalMinutes = Math.round(elapsedMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) return `${minutes}min`
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`
}

/**
 * Recalcule status/progressPercent/currentScore/lastExerciseIndex d'un
 * Module et de ses activités à partir des vrais snapshots localStorage —
 * appelée côté client (useEffect) sur un Module dont les champs de
 * progression sont neutres (voir lib/assignedModules.ts,
 * buildStructuralModule, qui les pose côté serveur où localStorage n'est
 * pas accessible). "done" pour une activité = chaque exercice a un
 * résultat final dans `attempts` (même critère que `hasCompleted` dans
 * useNiveauProgress) — PAS `currentIndex >= nombre d'exercices`, qui ne
 * peut jamais être vrai puisque goToExercise plafonne currentIndex au
 * dernier exercice valide, sans jamais dépasser. Progression toujours
 * libre — aucune activité n'est verrouillée par l'état de la précédente
 * (locked reste toujours false).
 *
 * niveauDueDates (épopée 5 — assignation par activité) : une activité
 * avec sa PROPRE échéance dans cette table utilise celle-ci pour son
 * statut "en retard", indépendamment de dueDate (l'échéance du module
 * entier) — sert le scénario du rattrapage ciblé, où une activité précise
 * a une échéance différente du reste du module.
 */
export async function hydrateModuleProgress(
    module: Module,
    dueDate?: string,
    niveauDueDates?: Record<string, string>
): Promise<Module> {
    const isModulePastDue = Boolean(dueDate) && new Date(dueDate as string).getTime() < Date.now()

    const instantanes = await chargerInstantanes(module)

    function isNiveauPastDue(niveauId: string): boolean {
        const ownDueDate = niveauDueDates?.[niveauId]
        if (ownDueDate) return new Date(ownDueDate).getTime() < Date.now()
        return isModulePastDue
    }

    const hydratedNiveaux: Niveau[] = module.niveaux.map((niveau) => {
        const snapshot = instantanes[cleDeStockage(niveau)] ?? null
        const exerciseCount = niveau.exercises.length

        // "Commencé" doit refléter TOUT signe d'interaction, pas juste une
        // tentative soumise — un brouillon posé mais jamais validé
        // (drafts) compte tout autant qu'une tentative dans `attempts` ou
        // `attemptsLog`. Même critère que getStepperStatus dans
        // useNiveauProgress.ts (hooks/useNiveauProgress.ts), qui, lui,
        // vérifiait déjà les brouillons — sans ce 3e OR, les deux
        // désaccordaient sur ce qui compte comme "commencé", pour la même
        // donnée.
        const hasStarted =
            snapshot !== null &&
            (Object.keys(snapshot.attempts).length > 0 ||
                snapshot.attemptsLog.length > 0 ||
                Object.keys(snapshot.drafts).length > 0)
        const lastExerciseIndex = snapshot !== null && hasStarted ? snapshot.currentIndex : null
        const currentScore = snapshot ? snapshot.bestScore : null

        const completedCount = snapshot
            ? niveau.exercises.filter((exercise) => snapshot.attempts[exercise.id]?.result != null).length
            : 0
        const isDone = exerciseCount > 0 && completedCount === exerciseCount

        const progressPercent = isDone
            ? 100
            : exerciseCount > 0
              ? Math.round((completedCount / exerciseCount) * 100)
              : 0

        let status: AssignmentStatus = "todo"
        if (isDone) status = "done"
        else if (isNiveauPastDue(niveau.id)) status = "late"
        else if (hasStarted) status = "in-progress"

        return {
            ...niveau,
            progressPercent,
            status,
            locked: false,
            intro: { ...niveau.intro, currentScore },
            lastExerciseIndex,
        }
    })

    const moduleProgressPercent =
        hydratedNiveaux.length === 0
            ? 0
            : Math.round(hydratedNiveaux.reduce((sum, n) => sum + n.progressPercent, 0) / hydratedNiveaux.length)

    const allDone = hydratedNiveaux.length > 0 && hydratedNiveaux.every((n) => n.status === "done")
    const anyLate = hydratedNiveaux.some((n) => n.status === "late")
    const anyStarted = hydratedNiveaux.some((n) => n.status !== "todo")

    let moduleStatus: AssignmentStatus = "todo"
    if (allDone) moduleStatus = "done"
    else if (anyLate) moduleStatus = "late"
    else if (anyStarted) moduleStatus = "in-progress"

    return {
        ...module,
        progressPercent: moduleProgressPercent,
        status: moduleStatus,
        progressLabelOverride: moduleStatus === "late" ? "Date limite dépassée" : undefined,
        niveaux: hydratedNiveaux,
    }
}