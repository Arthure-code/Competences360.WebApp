import { getResolvedAssignmentsForApprenant } from "@/_mocks/assignments.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getModuleVersionById } from "@/_mocks/moduleVersions.mock"
import { getUserById } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import { routes } from "@/constants/routes"
import type { Deadline } from "@/types/deadline"
import type { Module, Niveau } from "@/types/module"
import type { ApprenantModuleProgressEntry } from "@/types/apprenantModuleProgress"

/**
 * Fusionné depuis dashboardData.ts + dashboardResume.ts — les deux ne
 * servaient qu'Accueil apprenant (DashboardView.tsx), assez liés pour ne
 * pas justifier 2 fichiers séparés (voir la discussion sur la
 * centralisation, épopée 3). Renommé apprenantDashboard.ts pour
 * correspondre à la convention déjà établie par formateurDashboard.ts.
 */

/**
 * Remplace dashboard.mock.ts (upcomingDeadlinesMock, entièrement inventé,
 * jamais relié aux vraies assignations) — construit depuis les vraies
 * échéances (voir getResolvedAssignmentsForApprenant, assignments.mock.ts),
 * triées par urgence (la plus proche en premier). Seules les assignations
 * avec une vraie dueDate sont retenues.
 *
 * assignedByName vient de getUserById (voir users.mock.ts, limité aux 4
 * comptes de test pour l'instant) — "votre formateur" en repli générique
 * si non résolu, plutôt qu'un champ vide.
 */
export async function getUpcomingDeadlinesForApprenant(
    userId: string,
    apprenantGroupIds: string[]
): Promise<Deadline[]> {
    const resolved = await getResolvedAssignmentsForApprenant(userId, apprenantGroupIds)
    const withDueDate = resolved.filter((r): r is typeof r & { dueDate: string } => Boolean(r.dueDate))

    const deadlines = await Promise.all(
        withDueDate.map(async (assignment): Promise<Deadline | null> => {
            const contentModule = await getContentModuleById(assignment.moduleId)
            if (!contentModule) return null

            const versionId = assignment.versionId ?? contentModule.officialVersionId
            const version = versionId ? await getModuleVersionById(versionId) : undefined
            const assigner = await getUserById(assignment.assignedByUserId)

            return {
                id: assignment.moduleId,
                moduleTitle: contentModule.title,
                categoryId: version?.content.categoryId ?? "",
                dueDate: assignment.dueDate,
                assignedByUserId: assignment.assignedByUserId,
                assignedByName: assigner ? getFullName(assigner) : "votre formateur",
                actionLabel: "Voir le module",
                href: routes.apprenant.modules.bySlug(contentModule.slug),
            }
        })
    )

    return deadlines
        .filter((d): d is Deadline => d !== null)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export interface ResumeTarget {
    module: Module
    exerciseTitle: string
    questionProgressLabel: string
    progressPercent: number
    resumeHref: string
}

/**
 * Trouve le module "en cours" le plus pertinent parmi une liste déjà
 * hydratée (voir hydrateModuleProgress, lib/moduleProgress.ts). Trie
 * maintenant par vraie dernière activité (lastActivityAt, voir
 * apprenantModuleProgress.mock.ts) quand plusieurs modules sont en cours
 * en même temps — auparavant, le premier module in-progress rencontré
 * dans la liste gagnait toujours, peu importe lequel avait vraiment été
 * touché en dernier (approximation notée dans une version antérieure de
 * ce commentaire, comblée maintenant que la donnée existe côté serveur).
 *
 * progressEntries optionnel (repli sur l'ancien comportement, 1er module
 * trouvé, si absent) — pour ne pas casser un appelant qui ne l'aurait pas
 * encore branché.
 */
export function findResumeTarget(modules: Module[], progressEntries: ApprenantModuleProgressEntry[] = []): ResumeTarget | null {
    const lastActivityByNiveauId = new Map(progressEntries.map((e) => [e.niveauId, e.lastActivityAt]))

    const inProgressModules = modules.filter((m) => m.status === "in-progress")
    if (inProgressModules.length === 0) return null

    let best: { module: Module; niveau: Niveau; lastActivityAt: string | null } | null = null
    for (const module of inProgressModules) {
        const niveau = module.niveaux.find((n) => n.status === "in-progress") ?? module.niveaux.find((n) => n.status === "todo")
        if (!niveau) continue
        const lastActivityAt = lastActivityByNiveauId.get(niveau.id) ?? null

        if (!best) {
            best = { module, niveau, lastActivityAt }
            continue
        }
        if (lastActivityAt && (!best.lastActivityAt || new Date(lastActivityAt).getTime() > new Date(best.lastActivityAt).getTime())) {
            best = { module, niveau, lastActivityAt }
        }
    }
    if (!best) return null

    const { module: inProgressModule, niveau } = best
    if (niveau.exercises.length === 0) return null

    const hasStarted = niveau.lastExerciseIndex !== null
    const exerciseIndex = hasStarted ? (niveau.lastExerciseIndex as number) : 0
    const exercise = niveau.exercises[exerciseIndex]
    if (!exercise) return null

    return {
        module: inProgressModule,
        exerciseTitle: niveau.title,
        questionProgressLabel: `Question ${exerciseIndex + 1} / ${niveau.exercises.length}`,
        progressPercent: niveau.progressPercent,
        resumeHref: routes.apprenant.modules.exercice(inProgressModule.slug, niveau.slug, exercise.slug),
    }
}