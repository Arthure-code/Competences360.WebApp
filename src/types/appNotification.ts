export interface AppNotification {
    id: string
    userId: string
    /** Nom d'icône FontAwesome (lib/icon-registry.ts) */
    icon: string
    title: string
    description: string
    createdAt: string
    /** Absent = non lue */
    readAt?: string
    actionLabel?: string
    actionHref?: string
}
