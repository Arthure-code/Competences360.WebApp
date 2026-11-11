import type { Category } from "@/types/category"

/**
 * Épopée 8 — catégories org-scopées. Une catégorie globale (scope:
 * "global") n'est jamais modifiable/supprimable depuis une org, peu
 * importe le rôle — seule la plateforme les gère (voir la discussion sur
 * le rôle Administrateur, en pause). Pour une catégorie org-scopée : le
 * créateur peut modifier/supprimer la sienne, le gestionnaire peut le
 * faire sur n'importe laquelle de son org — même règle de droits que la
 * corbeille de contenu (lib/contentTrash.ts, canTrashModule), pas une
 * mécanique différente réinventée pour l'occasion.
 */
export function canEditCategory(category: Category, userId: string, isGestionnaireOfThisOrg: boolean, isAdmin = false): boolean {
    if (category.scope === "global") return isAdmin
    if (isGestionnaireOfThisOrg) return true
    return category.createdByUserId === userId
}

/**
 * Supprimer une catégorie globale — contrairement à renommer (sans
 * risque, canEditCategory suffit), supprimer casse le classement de
 * tout module qui l'utilise encore. Bloqué tant qu'au moins un module y
 * fait référence, peu importe l'organisation — pas juste un
 * avertissement qu'on peut ignorer (voir la discussion : dupliquer ou
 * fusionner automatiquement créeraient plus de désordre que ça n'en
 * réglerait).
 */
export function canDeleteGlobalCategory(moduleCount: number): boolean {
    return moduleCount === 0
}