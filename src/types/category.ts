export type CategoryScope = "global" | "org"
export type CategoryVisibility = "public"

export interface Category {
    id: string
    label: string
    description: string
    /** Nom d'icône FontAwesome solid (ex. "faBookOpen") — résolu par resolveIcon, lib/icon-registry.ts */
    iconName: string
    color: string
    /**
     * "global" = fournie par la plateforme (voir categories.mock.ts, les
     * 3 catégories de base), jamais modifiable ni supprimable par une
     * org. "org" = créée par un formateur/gestionnaire d'une
     * organisation précise (épopée 8) — voir orgId/createdByUserId.
     */
    scope: CategoryScope
    visibility: CategoryVisibility
    /** Rempli seulement si scope === "org" — l'org à laquelle cette catégorie appartient, jamais visible en dehors */
    orgId?: string
    /** Rempli seulement si scope === "org" — le créateur, en plus du gestionnaire, a le droit de modifier/supprimer (voir lib/categoryRights.ts) */
    createdByUserId?: string
}