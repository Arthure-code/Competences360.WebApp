"use server"

import { api } from "@/lib/api"
import type { Assignment } from "@/types/assignment"

/**
 * Mutations sur Assignment, branchées sur AssignmentsController.
 */

interface CreateAssignmentInput {
    /** « module » (par défaut) = tout le module ; « niveau » = une activité précise à l'intérieur. */
    targetType?: Assignment["targetType"]
    /** Id du module ciblé, ou id de l'activité ciblée selon targetType. */
    targetId: string
    /** Version précise assignée — omis = la version officielle courante du module (voir types/assignment.ts) */
    versionId?: string
    assignedTo: Assignment["assignedTo"]
    dueDate?: string
    assignedByUserId: string
}

/**
 * Assigne un module, ou une activité précise, à un apprenant ou à un groupe.
 *
 * assignedByUserId n'est pas transmis : l'API l'établit depuis les claims.
 * L'union assignedTo est aplatie en deux champs optionnels dont un seul est
 * renseigné — la forme qu'attend AssignModuleDto.
 *
 * Sur une cible « niveau », le module n'est pas envoyé : l'API le déduit de
 * la version, qui fait autorité sur son module. C'est déjà ce qu'elle fait
 * pour une assignation de module entier sans version explicite.
 */
export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
    const cibleActivite = input.targetType === "niveau"

    return await api.post<Assignment>("/api/assignments", {
        // Version omise = l'officielle du module au moment de l'assignation,
        // résolue côté serveur — d'où l'envoi systématique du module quand
        // c'est lui qui est visé.
        idContentModule: cibleActivite ? null : Number(input.targetId),
        targetNiveauId: cibleActivite ? input.targetId : null,
        idModuleVersion: input.versionId ? Number(input.versionId) : null,

                idApprenantUser: input.assignedTo.type === "apprenant" ? Number(input.assignedTo.userId) : null,
        idGroup: input.assignedTo.type === "group" ? Number(input.assignedTo.groupId) : null,
        dueDate: input.dueDate,
    })
}

/** Retire une assignation — le contenu lui-même n'est jamais touché, juste le lien. */
export async function deleteAssignment(assignmentId: string): Promise<void> {
    await api.delete(`/api/assignments/${encodeURIComponent(assignmentId)}`)
}