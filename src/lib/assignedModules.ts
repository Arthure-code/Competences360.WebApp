
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getModuleVersionById } from "@/_mocks/moduleVersions.mock"
import { getResolvedAssignmentsForApprenant, getResolvedAssignmentsForGroup, getAssignmentsForContentModule } from "@/_mocks/assignments.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import type { ResolvedAssignment } from "@/_mocks/assignments.mock"
import type { Assignment } from "@/types/assignment"
import type { Module, Niveau, NiveauIntro } from "@/types/module"

export interface AssignedModuleResult {
    module: Module
    /** Vient de l'assignation résolue — nécessaire côté client pour calculer le statut "En retard" (voir hydrateModuleProgress, lib/moduleProgress.ts). Pas un champ sur Module lui-même : une échéance concerne l'assignation, pas le contenu. */
    dueDate?: string
    /**
     * Échéances propres à une activité précise du module (épopée 5 —
     * assignation par activité), en plus de dueDate — voir
     * ResolvedAssignment.niveauDueDates (assignments.mock.ts). Consommé
     * par hydrateModuleProgress pour calculer le statut "En retard" au
     * niveau de l'activité, pas seulement du module.
     */
    niveauDueDates?: Record<string, string>
}

/**
 * Convertit une version de contenu (créée dans l'éditeur formateur/
 * gestionnaire) en Module/Niveau — le type que consomment ModuleCard, la
 * page de détail, l'intro de niveau et l'exercice. Aucun champ lié à la
 * progression n'est fiable ici (status, progressPercent, currentScore,
 * lastExerciseIndex) : ils dépendent de localStorage
 * (progress-storage.ts), inaccessible côté serveur. Ils sont posés à une
 * valeur neutre ("todo", 0%) puis recalculés côté client — voir
 * hydrateModuleProgress dans lib/moduleProgress.ts.
 */
async function buildStructuralModule(resolved: ResolvedAssignment): Promise<AssignedModuleResult | null> {
    const contentModule = await getContentModuleById(resolved.moduleId)
    if (!contentModule) return null

    const versionId = resolved.versionId ?? contentModule.officialVersionId
    if (!versionId) return null

    const version = await getModuleVersionById(versionId)
    if (!version) return null

    const niveaux: Niveau[] = version.content.niveaux.map((niveauDraft) => {
        const maxScore = niveauDraft.exercises.length
        const intro: NiveauIntro = {
            description: niveauDraft.description,
            practiceItems: niveauDraft.practiceItems,
            exerciseCount: niveauDraft.exercises.length,
            durationMinutes: niveauDraft.durationMinutes,
            currentScore: null,
            maxScore,
        }

        const niveau: Niveau = {
            id: niveauDraft.id,
            moduleId: contentModule.id,
            slug: `activite-${niveauDraft.index}`,
            index: niveauDraft.index,
            title: niveauDraft.title,
            subtitle: "",
            difficulty: niveauDraft.difficulty,
            progressPercent: 0,
            status: "todo",
            locked: false,
            intro,
            // moduleId ET niveauId dénormalisés ici, pas dans
            // ModuleVersionContent — voir ExerciseBase (types/exercise.ts).
            // useNiveauProgress les dérive de exercises[0] ; or le JSON écrit
            // par l'éditeur ne porte pas niveauId sur les exercices : sans
            // cette ligne, la clé d'instantané retombe sur « unknown » et
            // tous les niveaux du module écrivent au même endroit.
            exercises: niveauDraft.exercises.map((exercise) => ({
                ...exercise,
                moduleId: contentModule.id,
                niveauId: niveauDraft.id,
            })),
            lastExerciseIndex: null,
        }
        return niveau
    })

    const module: Module = {
        id: contentModule.id,
        slug: contentModule.slug,
        categoryId: version.content.categoryId,
        title: version.content.title,
        description: version.content.description,
        status: "todo",
        assigned: true,
        progressPercent: 0,
        niveaux,
        externalLinks: version.content.externalLinks ?? [],
    }
    return { module, dueDate: resolved.dueDate, niveauDueDates: resolved.niveauDueDates }
}

/**
 * Point d'entrée pour toute page apprenant qui doit lister/afficher les
 * modules assignés — remplace getAllModules/getAssignedModules
 * (_mocks/modules.mock.ts, ancien catalogue statique). Server Component
 * uniquement : les champs de progression retournés sont neutres (voir
 * buildStructuralModule), à faire passer par hydrateModuleProgress une
 * fois côté client.
 */
export async function getAssignedModulesStructural(
    userId: string,
    apprenantGroupIds: string[]
): Promise<AssignedModuleResult[]> {
    const resolved = await getResolvedAssignmentsForApprenant(userId, apprenantGroupIds)
    const results = await Promise.all(resolved.map(buildStructuralModule))
    return results.filter((result): result is AssignedModuleResult => result !== null)
}

/**
 * Un seul module structurel, par slug — pour la page de détail d'un
 * module et ses routes filles (intro de niveau, exercice, bilan). undefined
 * si ce module n'est pas assigné à cet apprenant (direct ou via un
 * groupe) : mieux vaut ne rien afficher que d'afficher un module que
 * l'apprenant n'a pas le droit de voir.
 */
export async function getAssignedModuleBySlug(
    slug: string,
    userId: string,
    apprenantGroupIds: string[]
): Promise<AssignedModuleResult | undefined> {
    const results = await getAssignedModulesStructural(userId, apprenantGroupIds)
    return results.find((result) => result.module.slug === slug)
}

/**
 * Modules assignés à CE groupe précisément (pas ceux assignés
 * individuellement à un membre) — remplace group.moduleIds, un reliquat
 * de l'ancien système : la vraie source de vérité pour "qu'est-ce qui est
 * assigné à ce groupe" est Assignment, pas un champ sur Group. Réutilise
 * buildStructuralModule, même conversion que pour un apprenant — aucun
 * champ de progression fiable ici non plus (pas un apprenant précis, pas
 * de sens d'hydrater depuis un localStorage).
 *
 * Délègue à getResolvedAssignmentsForGroup (assignments.mock.ts), qui
 * résout maintenant les assignations de module entier ET d'activité
 * précise (épopée 5) — avant, cette fonction filtrait manuellement aux
 * seules assignations de module, une activité assignée à tout un groupe
 * n'était jamais résolue.
 */
export async function getAssignedModulesForGroup(groupId: string): Promise<AssignedModuleResult[]> {
    const resolved = await getResolvedAssignmentsForGroup(groupId)
    const results = await Promise.all(resolved.map(buildStructuralModule))
    return results.filter((result): result is AssignedModuleResult => result !== null)
}

export interface OverriddenGroupAssignment {
    assignment: Assignment
    groupName: string
}

/**
 * Fusionné depuis assignmentOverrides.ts — même thème (résolution
 * d'assignation), déjà couplé dans les faits (les deux tournent autour de
 * ResolvedAssignment/Assignment).
 *
 * Si CET apprenant est couvert par une assignation de GROUPE pour LE MÊME
 * module, retourne cette assignation (+ le nom du groupe) — sinon null.
 * L'individuelle l'emporte toujours en cas de conflit (voir
 * getResolvedAssignmentsForApprenant, assignments.mock.ts) ; cette
 * fonction sert à SIGNALER ce remplacement (liste + avertissement à la
 * création), jamais à le recalculer différemment. Une seule source de
 * vérité pour les deux endroits, pas de logique dupliquée.
 *
 * Pas de dépendance server-only (pas de "use server", pas de next/headers)
 * — appelable directement depuis un composant client, comme
 * getUserByEmail l'est déjà ailleurs (AddApprenantsTable.tsx).
 */
export async function getOverriddenGroupAssignment(
    moduleId: string,
    apprenantUserId: string
): Promise<OverriddenGroupAssignment | null> {
    const [myGroups, assignments] = await Promise.all([
        getMyGroups(apprenantUserId),

        // Les assignations de CE module, tous destinataires confondus —
        // l'API les rend déjà filtrées, il ne reste qu'à retenir celles qui
        // passent par un groupe dont l'apprenant est membre.
        getAssignmentsForContentModule(moduleId),
    ])

    const myGroupIds = new Set(myGroups.map((g) => g.id))

    for (const assignment of assignments) {
        if (assignment.assignedTo.type !== "group") continue
        const groupId = assignment.assignedTo.groupId
        if (!myGroupIds.has(groupId)) continue

        const group = myGroups.find((g) => g.id === groupId)
        return { assignment, groupName: group?.name ?? "un groupe" }
    }
    return null
}