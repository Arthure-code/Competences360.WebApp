"use server"

import { api, apiTolerant } from "@/lib/api"
import type { ReviewComment } from "@/types/reviewComment"

/**
 * Commentaires de révision, branchés sur ReviewCommentsController.
 *
 * Le tableau reviewCommentsMock a disparu : moduleVersions.actions.ts le
 * parcourait pour compter les non résolus avant une resoumission. Ce
 * comptage est refait côté serveur au moment de l'appel, ce qui est plus
 * juste — un commentaire ajouté entre-temps est pris en compte.
 */

/** Tous les commentaires d'une version, du plus ancien au plus récent. */
export async function getCommentsForVersion(versionId: string): Promise<ReviewComment[]> {
    return await apiTolerant(
        () => api.get<ReviewComment[]>(`/api/reviewcomments/version/${encodeURIComponent(versionId)}`),
        [],
    )
}

/** Nombre de commentaires non résolus sur une version entière, sert au badge de la carte. */
export async function getUnresolvedCommentCount(versionId: string): Promise<number> {
    return await apiTolerant(
        () => api.get<number>(
            `/api/reviewcomments/version/${encodeURIComponent(versionId)}/non-resolus/compte`),
        0,
    )
}

/**
 * Variante en lot : un seul aller-retour pour toute une liste de versions.
 * Un identifiant hors de portée est absent de la réponse, donc compté 0,
 * exactement ce que rendait la lecture unitaire.
 */
export async function getUnresolvedCommentCounts(versionIds: string[]): Promise<Map<string, number>> {
    if (versionIds.length === 0) return new Map()

    const lignes = await apiTolerant(
        () => api.post<{ versionId: string; count: number }[]>(
            "/api/reviewcomments/non-resolus/comptes/lot",
            { versionIds: versionIds.map(Number) }),
        [],
    )

    return new Map(lignes.map((ligne) => [String(ligne.versionId), ligne.count]))
}

/** Nombre de commentaires (total et non résolus) sur UN élément précis, sert au badge « N » par élément. */
export async function getCommentCountForTarget(
    versionId: string,
    target: ReviewComment["target"],
    targetId: string
): Promise<{ total: number; unresolved: number }> {
    return await apiTolerant(
        () => api.get<{ total: number; unresolved: number }>(
            `/api/reviewcomments/version/${encodeURIComponent(versionId)}`
            + `/cible/${encodeURIComponent(target)}/${encodeURIComponent(targetId)}/compte`),
        { total: 0, unresolved: 0 },
    )
}