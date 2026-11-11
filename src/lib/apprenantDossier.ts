import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { getAllProgressForApprenant } from "@/_mocks/apprenantModuleProgress.mock"
import { getMomentsFortsForApprenant } from "@/_mocks/apprenantMomentsForts.mock"
import { getRecentAttemptsForApprenant, getRecentAttemptsForNiveau } from "@/_mocks/apprenantNiveauAttempts.mock"
import { getMomentFortDisplayFromEntry } from "@/lib/rewards"
import type { MomentFortDisplay } from "@/lib/rewards"
import type { ApprenantNiveauAttempt } from "@/types/apprenantNiveauAttempt"
import { isNiveauPassed } from "@/lib/scoring"
import { getPlatformConfiguration } from "@/_mocks/configuration.mock"
import type { Difficulty } from "@/types/module"

/**
 * Épopée 17 — dossier complet apprenant. Partagé entre la page formateur
 * et la page gestionnaire (les deux appellent cette même fonction) — un
 * seul endroit qui calcule "l'état de progression de cet apprenant", pas
 * deux implémentations à maintenir en parallèle.
 *
 * Contrairement à hydrateModuleProgress (lib/moduleProgress.ts), qui lit
 * localStorage, cette fonction lit le store SERVEUR
 * (apprenantModuleProgress.mock.ts) — un formateur/gestionnaire qui
 * consulte le dossier d'un AUTRE apprenant n'a jamais accès au
 * localStorage de cette personne, seul le serveur peut répondre ici.
 */

export type DossierNiveauStatus = "done" | "in-progress" | "todo"

export interface DossierNiveauEntry {
    niveauId: string
    niveauTitle: string
    difficulty: Difficulty
    status: DossierNiveauStatus
    /**
     * Score brut, même mécanique que celle vue par l'apprenant sur son
     * Bilan (barème servi par GET /api/configuration : `pointsExerciceReussi`
     * et `pointsExercicePartiel`) — pas juste un pourcentage arrondi, qui
     * perdrait la vraie mécanique de points. null si jamais tenté.
     */
    bestScore: number | null
    /** Dérivé de bestScore/maxScore — gardé en plus pour l'affichage compact, mais bestScore reste la vraie donnée */
    scorePercent: number | null
    maxScore: number
    /** Nombre de fois recommencé (voir totalAttemptsCount, apprenantModuleProgress.mock.ts) — 0 si jamais commencé ou réussi du premier coup */
    attemptsCount: number
    /**
     * Les 10 tentatives les plus récentes de CETTE activité précise, avec
     * score et horodatage — contrairement à attemptsCount (juste un
     * chiffre), donne le vrai historique : quand, quel score, dans quel
     * ordre. Vide si jamais recommencée (une réussite du premier coup ne
     * journalise rien, voir logNiveauAttempt).
     */
    recentAttempts: ApprenantNiveauAttempt[]
    /** Temps actif cumulé sur cette activité — voir timeSpentMs, types/apprenantModuleProgress.ts */
    timeSpentMs: number
}

export interface DossierModuleEntry {
    moduleId: string
    moduleTitle: string
    categoryId: string
    niveauxTotal: number
    niveauxCompleted: number
    isModuleComplete: boolean
    averageScorePercent: number | null
    /** Échéance dépassée ET module pas encore complet — même définition que le statut "En retard" ailleurs dans l'app */
    isLate: boolean
    /**
     * Détail par activité de ce module précis — sert le tiroir "cliquer
     * sur un module pour voir ses activités". Construit ici, une fois,
     * plutôt que refetché à l'ouverture du tiroir côté client.
     */
    niveaux: DossierNiveauEntry[]
    /** Somme du timeSpentMs de ses activités */
    timeSpentMs: number
}

export interface ApprenantDossierStats {
    modules: DossierModuleEntry[]
    modulesCompletedCount: number
    modulesInProgressCount: number
    modulesTodoCount: number
    modulesLateCount: number
    /** Moyenne de progressPercent sur tous les modules assignés — même calcul que Parcours apprenant (computeCategoryProgress, lib/progress.ts), appliqué ici aux modules plutôt qu'aux catégories */
    globalCompletionPercent: number
    /** Somme de totalAttemptsCount sur tous les niveaux touchés — un chiffre brut, pas une moyenne, pour donner une idée du volume d'effort total */
    totalAttempts: number
    bestNiveau: { niveauTitle: string; moduleTitle: string; scorePercent: number } | null
    worstNiveau: { niveauTitle: string; moduleTitle: string; scorePercent: number } | null
    momentsForts: MomentFortDisplay[]
    /** Les 10 tentatives les plus récentes, tous niveaux confondus — voir apprenantNiveauAttempts.mock.ts. Vue globale, en plus du détail par module dans le tiroir. */
    recentAttempts: ApprenantNiveauAttempt[]
    /**
     * Modules regroupés par palier de performance (parmi ceux avec au
     * moins un score, les non-tentés n'entrent dans aucun palier) —
     * meilleures (>=80%), moyennes (50-79%), basses (<50%). Complète
     * bestNiveau/worstNiveau (qui ne montrent qu'UN seul niveau chacun)
     * avec une vue d'ensemble par module.
     */
    moduleTiers: {
        best: DossierModuleEntry[]
        average: DossierModuleEntry[]
        weak: DossierModuleEntry[]
    }
    /**
     * Toutes les activités (pas seulement la pire) sous le seuil de
     * réussite (`seuilReussiteNiveauPourcent`, servi par
     * GET /api/configuration) — les vrais "endroits de faiblesse" à
     * surveiller, pas juste le pire cas isolé.
     */
    weakSpots: { niveauTitle: string; moduleTitle: string; scorePercent: number }[]
    /** Somme du timeSpentMs de tous les modules — voir types/apprenantModuleProgress.ts, jusqu'ici jamais stocké côté serveur, seulement dans localStorage (inaccessible à un formateur/gestionnaire consultant le dossier d'un autre apprenant) */
    totalTimeSpentMs: number
    /**
     * La dernière activité touchée mais pas encore complétée, la plus
     * récente (voir lastActivityAt) — équivalent de "Reprendre ici"
     * (Accueil apprenant), mais calculé ici depuis le store SERVEUR :
     * findResumeTarget (lib/apprenantDashboard.ts) lit localStorage,
     * inutilisable pour consulter le dossier de quelqu'un d'autre. null
     * si rien en cours (tout terminé, ou rien commencé).
     */
    resumePoint: { moduleTitle: string; niveauTitle: string; lastActivityAt: string } | null
}

export async function computeApprenantDossier(apprenantId: string): Promise<ApprenantDossierStats> {
    // Les groupes ne sont PAS lus ici, et c'est voulu : la résolution des
    // assignations les déduit du serveur, à partir de l'apprenant visé
    // (getResolvedAssignmentsForApprenant ignore le paramètre).
    //
    // La ligne d'avant appelait `getMyGroups(apprenantId)` — une lecture qui
    // répond TOUJOURS pour le compte connecté. Consulté par un formateur, le
    // dossier était donc construit sur les groupes DU FORMATEUR, jamais sur
    // ceux de l'apprenant. Le résultat alimentait de surcroît un paramètre
    // ignoré : un appel réseau pour une donnée fausse et inutilisée.
    const [assignedResults, progressEntries, momentsFortsEntries, recentAttempts, configuration] =
        await Promise.all([
            getAssignedModulesStructural(apprenantId, []),
            getAllProgressForApprenant(apprenantId),
            getMomentsFortsForApprenant(apprenantId),
            getRecentAttemptsForApprenant(apprenantId),
            getPlatformConfiguration(),
        ])

    const modules: DossierModuleEntry[] = await Promise.all(
        assignedResults.map(async ({ module, dueDate }) => {
            const niveaux: DossierNiveauEntry[] = await Promise.all(
                module.niveaux.map(async (niveau) => {
                    const entry = progressEntries.find((e) => e.niveauId === niveau.id)
                    const scorePercent =
                        entry && typeof entry.bestScore === "number" && entry.maxScore > 0
                            ? Math.round((entry.bestScore / entry.maxScore) * 100)
                            : null
                    const status: DossierNiveauStatus = entry?.isDone ? "done" : entry ? "in-progress" : "todo"
                    const niveauAttempts = await getRecentAttemptsForNiveau(apprenantId, niveau.id)

                    return {
                        niveauId: niveau.id,
                        niveauTitle: niveau.title,
                        difficulty: niveau.difficulty,
                        status,
                        bestScore: entry?.bestScore ?? null,
                        scorePercent,
                        maxScore: niveau.exercises.length,
                        attemptsCount: entry?.totalAttemptsCount ?? 0,
                        recentAttempts: niveauAttempts,
                        timeSpentMs: entry?.timeSpentMs ?? 0,
                    }
                })
            )

            const niveauxCompleted = niveaux.filter((n) => n.status === "done").length
            const isModuleComplete = niveaux.length > 0 && niveauxCompleted === niveaux.length

            const scorePercents = niveaux.map((n) => n.scorePercent).filter((p): p is number => p !== null)
            const averageScorePercent =
                scorePercents.length === 0 ? null : Math.round(scorePercents.reduce((sum, p) => sum + p, 0) / scorePercents.length)

            const isLate = Boolean(dueDate) && new Date(dueDate as string).getTime() < Date.now() && !isModuleComplete
            const moduleTimeSpentMs = niveaux.reduce((sum, n) => sum + n.timeSpentMs, 0)

            return {
                moduleId: module.id,
                moduleTitle: module.title,
                categoryId: module.categoryId,
                niveauxTotal: niveaux.length,
                niveauxCompleted,
                isModuleComplete,
                averageScorePercent,
                isLate,
                niveaux,
                timeSpentMs: moduleTimeSpentMs,
            }
        })
    )

    const modulesCompletedCount = modules.filter((m) => m.isModuleComplete).length
    const modulesLateCount = modules.filter((m) => m.isLate).length
    const modulesInProgressCount = modules.filter((m) => !m.isModuleComplete && !m.isLate && m.niveauxCompleted > 0).length
    const modulesTodoCount = modules.length - modulesCompletedCount - modulesLateCount - modulesInProgressCount

    const globalCompletionPercent =
        modules.length === 0
            ? 0
            : Math.round(modules.reduce((sum, m) => sum + (m.niveauxTotal > 0 ? (m.niveauxCompleted / m.niveauxTotal) * 100 : 0), 0) / modules.length)

    const totalAttempts = progressEntries.reduce((sum, e) => sum + e.totalAttemptsCount, 0)

    // Meilleur/pire niveau — seulement parmi les niveaux avec un vrai score, sur tous les modules assignés.
    const allNiveauScores = modules.flatMap((m) =>
        m.niveaux
            .filter((n) => n.scorePercent !== null)
            .map((n) => ({ niveauTitle: n.niveauTitle, moduleTitle: m.moduleTitle, scorePercent: n.scorePercent as number }))
    )
    const sortedByScore = [...allNiveauScores].sort((a, b) => b.scorePercent - a.scorePercent)
    const bestNiveau = sortedByScore[0] ?? null
    const worstNiveau = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null

    // Tous les niveaux sous le seuil de réussite (60%, lib/scoring.ts) — pas seulement le pire, une vraie liste de ce qui mérite un coup d'œil.
    const weakSpots = allNiveauScores
        .filter((n) => !isNiveauPassed(n.scorePercent, 100, configuration.seuilReussiteNiveauPourcent))
        .sort((a, b) => a.scorePercent - b.scorePercent)

    // Modules par palier de performance — seulement ceux avec au moins un score (averageScorePercent non-null), pas les modules jamais tentés.
    const attemptedModules = modules.filter((m) => m.averageScorePercent !== null)
    const moduleTiers = {
        best: attemptedModules.filter((m) => (m.averageScorePercent as number) >= 80),
        average: attemptedModules.filter((m) => (m.averageScorePercent as number) >= 50 && (m.averageScorePercent as number) < 80),
        weak: attemptedModules.filter((m) => (m.averageScorePercent as number) < 50),
    }

    const momentsForts = momentsFortsEntries.map(getMomentFortDisplayFromEntry)

    const totalTimeSpentMs = modules.reduce((sum, m) => sum + m.timeSpentMs, 0)

    // Point de reprise — le niveau touché mais pas complété, le plus
    // récemment actif (lastActivityAt) parmi les vraies entrées de
    // progression, pas un instantané localStorage. Cherché directement
    // dans progressEntries (pas dans `modules`, qui ne garde pas
    // lastActivityAt) puis résolu vers son titre/module via `modules`.
    const inProgressEntries = progressEntries
        .filter((e) => !e.isDone)
        .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    let resumePoint: ApprenantDossierStats["resumePoint"] = null
    for (const entry of inProgressEntries) {
        const module = modules.find((m) => m.moduleId === entry.moduleId)
        const niveau = module?.niveaux.find((n) => n.niveauId === entry.niveauId)
        if (module && niveau) {
            resumePoint = { moduleTitle: module.moduleTitle, niveauTitle: niveau.niveauTitle, lastActivityAt: entry.lastActivityAt }
            break
        }
    }

    return {
        modules,
        modulesCompletedCount,
        modulesInProgressCount,
        modulesTodoCount,
        modulesLateCount,
        globalCompletionPercent,
        totalAttempts,
        bestNiveau,
        worstNiveau,
        momentsForts,
        recentAttempts,
        moduleTiers,
        weakSpots,
        totalTimeSpentMs,
        resumePoint,
    }
}