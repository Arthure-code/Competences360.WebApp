"use server"

import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import type { Category } from "@/types/category"

/**
 * Mutations sur les catégories d'organisation.
 *
 * `requestingUserId` et `isGestionnaireOfThisOrg` restent dans les
 * signatures mais ne sont pas transmis : le serveur recalcule les droits
 * depuis les rôles réels et l'organisation des claims.
 *
 * isAdmin (nouveau, additif) — une catégorie GLOBAL (pas "organisation")
 * n'a pas encore de route confirmée côté backend. Route DEVINÉE
 * (/api/categories/globale) par symétrie avec /api/categories/organisation
 * — à confirmer avec le backend. ADMIN_COOKIE explicite sur ces appels,
 * même patron que adminContent.actions.ts.
 */

interface CreateCategoryInput {
    label: string
    description: string
    iconName: string
    color: string
    organizationId: string
    createdByUserId: string
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    void input.organizationId
    void input.createdByUserId

    return await api.post<Category>("/api/categories/organisation", {
        label: input.label.trim(),
        description: input.description.trim(),
        iconName: input.iconName,
        color: input.color,
    })
}

interface CreateGlobalCategoryInput {
    label: string
    description: string
    iconName: string
    color: string
    createdByUserId: string
}

export async function createGlobalCategory(input: CreateGlobalCategoryInput): Promise<Category> {
    void input.createdByUserId

    return await api.post<Category>(
        "/api/categories/globale",
        { label: input.label.trim(), description: input.description.trim(), iconName: input.iconName, color: input.color },
        { cookieName: ADMIN_COOKIE }
    )
}

export async function updateCategory(
    categoryId: string,
    updates: { label?: string; description?: string; iconName?: string; color?: string },
    requestingUserId: string,
    isGestionnaireOfThisOrg: boolean,
    isAdmin = false
): Promise<boolean> {
    void requestingUserId
    void isGestionnaireOfThisOrg

    const path = isAdmin
        ? `/api/categories/globale/${encodeURIComponent(categoryId)}`
        : `/api/categories/organisation/${encodeURIComponent(categoryId)}`

    return await apiTolerant(
        async () => {
            await api.put(path, updates, isAdmin ? { cookieName: ADMIN_COOKIE } : undefined)
            return true
        },
        false,
    )
}

export async function deleteCategory(
    categoryId: string,
    requestingUserId: string,
    isGestionnaireOfThisOrg: boolean,
    isAdmin = false
): Promise<boolean> {
    void requestingUserId
    void isGestionnaireOfThisOrg

    const path = isAdmin
        ? `/api/categories/globale/${encodeURIComponent(categoryId)}`
        : `/api/categories/organisation/${encodeURIComponent(categoryId)}`

    return await apiTolerant(
        async () => {
            await api.delete(path, isAdmin ? { cookieName: ADMIN_COOKIE } : undefined)
            return true
        },
        false,
    )
}