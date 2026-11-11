"use server"

import { api, apiTolerant } from "@/lib/api"
import type { ApprenantModuleProgressEntry } from "@/types/apprenantModuleProgress"

/**
 * Lectures de progression apprenant.
 *
 * Contrairement aux autres modules, les identifiants d'apprenant sont bien
 * transmis : ces routes servent aussi à consulter le dossier de quelqu'un
 * d'autre. L'API décide qui a le droit, et répond 404 hors périmètre.
 */

/** Entrées d'un apprenant pour un module précis. */
export async function getModuleProgressForApprenant(
    userId: string,
    moduleId: string
): Promise<ApprenantModuleProgressEntry[]> {
    return await apiTolerant(
        () => api.get<ApprenantModuleProgressEntry[]>(
            `/api/progression-apprenant/apprenant/${encodeURIComponent(userId)}`
            + `?moduleId=${encodeURIComponent(moduleId)}`),
        [],
    )
}

/** Entrées de tous les apprenants pour un module, pour la vue d'utilisation. */
export async function getAllProgressForModule(
    moduleId: string
): Promise<ApprenantModuleProgressEntry[]> {
    return await apiTolerant(
        () => api.get<ApprenantModuleProgressEntry[]>(
            `/api/progression-apprenant/module/${encodeURIComponent(moduleId)}`),
        [],
    )
}

/**
 * Associe chaque module aux apprenants qui y ont une trace de progression.
 * La liste envoyée est une demande : l'API la réduit à ce que l'appelant a
 * le droit de voir.
 */
export async function getModuleUserIdsForApprenants(
    userIds: string[]
): Promise<Record<string, string[]>> {
    if (userIds.length === 0) return {}

    return await apiTolerant(
        () => api.post<Record<string, string[]>>(
            "/api/progression-apprenant/modules-par-apprenants", userIds.map(Number)),
        {},
    )
}

/** Toutes les entrées d'un apprenant, tous modules confondus. */
export async function getAllProgressForApprenant(
    userId: string
): Promise<ApprenantModuleProgressEntry[]> {
    return await apiTolerant(
        () => api.get<ApprenantModuleProgressEntry[]>(
            `/api/progression-apprenant/apprenant/${encodeURIComponent(userId)}`),
        [],
    )
}