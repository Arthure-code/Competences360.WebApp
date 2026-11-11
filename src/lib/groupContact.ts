import { ROLE_LABELS } from "@/constants/roles"
import type { GroupContactRole } from "@/types/group"

/**
 * "Formateur", "Gestionnaire" ou "Formateur et gestionnaire" — réutilise
 * ROLE_LABELS (constants/roles.ts) plutôt que dupliquer les libellés, pour
 * ne jamais désynchroniser ce texte d'un renommage de rôle.
 */
export function formatContactRoleLabel(roles: GroupContactRole[]): string {
    if (roles.length === 0) return ""
    if (roles.length === 1) return ROLE_LABELS[roles[0]]
    return roles
        .map((role) => ROLE_LABELS[role].toLowerCase())
        .join(" et ")
        .replace(/^./, (c) => c.toUpperCase())
}
