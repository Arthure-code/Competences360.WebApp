"use server"

import { api, apiTolerant } from "@/lib/api"
import type { Category } from "@/types/category"

/** Catégories globales de la plateforme. */
export async function getAllCategories(): Promise<Category[]> {
    return await apiTolerant(
        () => api.get<Category[]>("/api/categories"),
        [],
    )
}

/** Rend `undefined` si la catégorie est introuvable. */
export async function getCategoryById(categoryId: string): Promise<Category | undefined> {
    const category = await apiTolerant(
        () => api.get<Category | null>(`/api/categories/${encodeURIComponent(categoryId)}`),
        null,
    )

    return category ?? undefined
}

/**
 * Catégories globales plus celles créées par cette organisation, visibles
 * par tous ses membres. Rend une liste vide si l'organisation est inconnue,
 * sans appeler l'API : un identifiant vide y produirait un 400, non toléré.
 */
export async function getCategoriesForOrganization(
    organizationId: string
): Promise<Category[]> {
    if (!organizationId) return []

    return await apiTolerant(
        () => api.get<Category[]>(
            `/api/categories/organisation/${encodeURIComponent(organizationId)}`),
        [],
    )
}

/**
 * Résout un ensemble d'identifiants en une passe. En POST malgré la
 * lecture : la liste peut dépasser la longueur admise dans une URL.
 */
export async function getCategoriesForIds(categoryIds: string[]): Promise<Category[]> {
    if (categoryIds.length === 0) return []

    return await apiTolerant(
        () => api.post<Category[]>("/api/categories/par-ids", categoryIds.map(Number)),
        [],
    )
}

/**
 * Vue apprenant : toutes les catégories globales, plus celles réellement
 * employées par ses modules assignés.
 *
 * Un apprenant n'a pas d'organisation propre, il peut relever de plusieurs
 * par ses groupes : on résout par les catégories utilisées plutôt que d'en
 * deviner une.
 */
export async function getCategoriesForApprenant(
    assignedModuleCategoryIds: string[]
): Promise<Category[]> {
    return await apiTolerant(
        () => api.post<Category[]>(
            "/api/categories/apprenant", assignedModuleCategoryIds.map(Number)),
        [],
    )
}