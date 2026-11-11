import { getAssignmentsForGroup, findModuleForNiveau } from "@/_mocks/assignments.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getModuleVersionById } from "@/_mocks/moduleVersions.mock"

/**
 * Épopée 16 — tabs Apprenants/Assignations dans le détail de groupe.
 * Résolution simplifiée par rapport à la page Assignations complète
 * (pas de target/assignedBy à résoudre, la cible EST toujours ce groupe)
 * — partagée entre formateur et gestionnaire, une seule fois.
 */
export interface GroupAssignationSummary {
    id: string
    moduleId: string
    moduleTitle: string
    /** Présent seulement si l'assignation cible une activité précise (épopée 5) */
    activityTitle?: string
    dueDate?: string
}

export async function getGroupAssignationsSummary(groupId: string): Promise<GroupAssignationSummary[]> {
    const assignments = await getAssignmentsForGroup(groupId)

    return Promise.all(
        assignments.map(async (assignment) => {
            const niveauLocation =
                assignment.targetType === "niveau" ? await findModuleForNiveau(assignment.targetId, assignment.versionId) : undefined
            const resolvedModuleId = (assignment.targetType === "module" ? assignment.targetId : niveauLocation?.moduleId) ?? ""

            const module = await getContentModuleById(resolvedModuleId)
            const resolvedVersionId = assignment.versionId ?? niveauLocation?.versionId ?? module?.officialVersionId
            const version = resolvedVersionId ? await getModuleVersionById(resolvedVersionId) : undefined

            return {
                id: assignment.id,
                moduleId: resolvedModuleId,
                moduleTitle: version?.content.title ?? module?.title ?? "Module introuvable",
                activityTitle: assignment.targetType === "niveau" ? (niveauLocation?.niveauTitle ?? "Activité introuvable") : undefined,
                dueDate: assignment.dueDate,
            }
        })
    )
}