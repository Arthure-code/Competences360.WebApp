"use server"

import { moveModuleToTrash } from "@/_mocks/contentModules.actions"

/**
 * Supervision Admin — retire le contenu d'une organisation que ni Admin
 * n'a créé, ni dont il est le gestionnaire. Utilise directement
 * isAdminAction/reason sur moveModuleToTrash (décision prise, voir
 * docs/espace-admin-notes-backend.md section 3).
 *
 * CORRECTIF — logAuditEntry retiré : cette fonction n'existe pas et ne
 * devrait pas exister. auditLog.mock.ts (le vrai, maintenant en main)
 * ne fait AUCUNE écriture locale — ses 3 fonctions lisent seulement
 * /api/journal-audit. Aucun fichier réel (reports.actions.ts,
 * organizationMembers.actions.ts...) n'appelle de fonction de
 * journalisation explicite non plus, pourtant leurs actions
 * apparaissent déjà dans le journal (confirmé par test) — le backend
 * consigne lui-même automatiquement. Une fois isAdminAction/reason
 * acceptés par la route de corbeille (section 3 du doc), l'entrée
 * d'audit doit apparaître sans action supplémentaire ici.
 */
export async function superviseTrashModule(input: {
    moduleId: string
    adminId: string
    reason: string
}): Promise<{ success: boolean; error?: string }> {
    if (!input.reason.trim()) return { success: false, error: "Une raison est requise." }

    try {
        const didTrash = await moveModuleToTrash(input.moduleId, input.adminId, false, true, input.reason.trim())
        if (!didTrash) {
            return { success: false, error: "Le serveur a refusé cette action — droits insuffisants pour ce contenu." }
        }
        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Une erreur est survenue." }
    }
}