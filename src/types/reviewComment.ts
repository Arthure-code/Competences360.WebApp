/**
 * Un commentaire de révision, laissé par le gestionnaire (ou une réponse
 * du formateur) sur un élément précis d'une version. La "raison globale"
 * n'en fait pas partie, elle vit directement sur ModuleVersion.reviewReason
 * (un peu comme un message de commit, jamais coché).
 *
 * Un seul niveau : un commentaire, une réponse au maximum, jamais de fil
 * qui s'empile. Si le gestionnaire n'est pas satisfait après la réponse,
 * il rouvre ce commentaire ou en ajoute un nouveau sur le même élément,
 * plutôt que d'empiler une 2e réponse.
 */
export interface ReviewComment {
    id: string
    versionId: string
    /** Jamais "global", voir le commentaire plus haut */
    target: "niveau" | "exercise"
    targetId: string
    text: string
    authorUserId: string
    authorName: string
    createdAt: string
    resolved: boolean
    /** true si ce commentaire a déjà été résolu au moins une fois puis rouvert, affiche un badge distinct d'un commentaire jamais traité */
    reopened: boolean
    response?: {
        text: string
        authorUserId: string
        authorName: string
        createdAt: string
    }
}
