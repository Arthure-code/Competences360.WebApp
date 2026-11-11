"use server"

import { api } from "@/lib/api"
import type { ReviewComment } from "@/types/reviewComment"

interface CreateCommentInput {
    versionId: string
    target: ReviewComment["target"]
    targetId: string
    text: string
    authorUserId: string
    authorName: string
}

/**
 * Dépose un commentaire.
 *
 * authorUserId et authorName restent dans la signature pour ne pas toucher
 * aux appelants, mais ne partent pas : l'API déduit l'auteur du compte
 * connecté. On ne commente pas sous l'identité de quelqu'un d'autre.
 */
export async function createReviewComment(input: CreateCommentInput): Promise<ReviewComment> {
    return await api.post<ReviewComment>("/api/reviewcomments", {
        versionId: Number(input.versionId),
        target: input.target,
        targetId: input.targetId,
        text: input.text,
    })
}

/**
 * Bascule résolu/non résolu, les deux côtés peuvent le faire (le
 * gestionnaire qui n'est pas satisfait rouvre, pas juste le formateur qui
 * coche). reopened passe à true seulement en repassant de résolu à non
 * résolu, jamais remis à false ensuite, pour distinguer visuellement
 * « jamais traité » de « on y revient ».
 */
export async function toggleCommentResolved(commentId: string): Promise<void> {
    await api.put(`/api/reviewcomments/${encodeURIComponent(commentId)}/resolution`)
}

export async function respondToComment(commentId: string, text: string, authorUserId: string, authorName: string): Promise<void> {
    void authorUserId
    void authorName

    await api.put(`/api/reviewcomments/${encodeURIComponent(commentId)}/reponse`, { text })
}

/**
 * Seul l'auteur peut supprimer son propre commentaire. La règle est
 * appliquée par l'API — requestingUserId ne part plus, il ne servait qu'à
 * la vérifier côté client.
 */
export async function deleteReviewComment(commentId: string, requestingUserId: string): Promise<void> {
    void requestingUserId

    await api.delete(`/api/reviewcomments/${encodeURIComponent(commentId)}`)
}