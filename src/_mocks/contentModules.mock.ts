"use server"

import { api, apiTolerant } from "@/lib/api"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"

/**
 * Une entrée de la file « À réviser » du gestionnaire.
 *
 * `reason` distingue deux cas : « auto-applied » pour une version jamais
 * révisée appliquée à la publication, « resubmitted » pour une version
 * resoumise après traitement des commentaires.
 */
export interface PendingReviewEntry {
    module: ContentModule
    version: ModuleVersion
    reason: "auto-applied" | "resubmitted"
}

/** Modules actifs de l'organisation. Exclut ceux à la corbeille. */
export async function getContentModules(organizationId: string): Promise<ContentModule[]> {
    return await apiTolerant(
        () => api.get<ContentModule[]>(
            `/api/contentmodules/organisation/${encodeURIComponent(organizationId)}`),
        [],
    )
}

/** Rend `undefined` si le module est introuvable ou hors de portée. */
export async function getContentModuleById(moduleId: string): Promise<ContentModule | undefined> {
    const module = await apiTolerant(
        () => api.get<ContentModule | null>(
            `/api/contentmodules/${encodeURIComponent(moduleId)}`),
        null,
    )

    return module ?? undefined
}

/** Rend `undefined` si aucun module actif ne porte ce slug. */
export async function getContentModuleBySlug(slug: string): Promise<ContentModule | undefined> {
    const module = await apiTolerant(
        () => api.get<ContentModule | null>(
            `/api/contentmodules/slug/${encodeURIComponent(slug)}`),
        null,
    )

    return module ?? undefined
}

/** File « À réviser » du gestionnaire. Le classement des deux cas vient de l'API. */
export async function getModulesPendingReview(
    organizationId: string
): Promise<PendingReviewEntry[]> {
    return await apiTolerant(
        () => api.get<PendingReviewEntry[]>(
            `/api/contentmodules/organisation/${encodeURIComponent(organizationId)}/pending-review`),
        [],
    )
}

/**
 * Modules à la corbeille, le plus récemment jeté en premier. Ils restent
 * accessibles par identifiant et par slug, pour la page de restauration.
 */
export async function getTrashedModulesForOrganization(
    organizationId: string
): Promise<ContentModule[]> {
    return await apiTolerant(
        () => api.get<ContentModule[]>(
            `/api/contentmodules/organisation/${encodeURIComponent(organizationId)}/corbeille`),
        [],
    )
}