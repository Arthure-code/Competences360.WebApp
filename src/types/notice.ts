export type NoticeVariant = "success" | "warning" | "error" | "info"

/**
 * Contenu d'une notification in-app — remplace AchievementBlock (réussite),
 * DismissibleBanner (alerte "modules en retard") et l'usage form de
 * InlineNotice (erreur de saisie) : même forme de données pour les trois,
 * seuls le variant et la taille d'affichage (voir composant Notice)
 * changent. Le champ `title` est absent en usage compact (erreur de
 * formulaire) mais présent partout ailleurs.
 */
export interface Notice {
    variant: NoticeVariant
    /** Nom d'icône FontAwesome (lib/icon-registry.ts) — absent = icône par défaut du variant */
    icon?: string
    title?: string
    message: string
    actionHref?: string
    actionLabel?: string
    dismissible?: boolean
}