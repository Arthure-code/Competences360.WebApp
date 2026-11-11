import type { AppNotification } from "@/types/appNotification"

export interface NotificationGroup {
    label: string
    notifications: AppNotification[]
}

function startOfDay(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** "Aujourd'hui" / "Hier" / "Il y a N jours" — regroupement, pas l'horodatage précis d'un item */
function getRelativeDayLabel(createdAt: string): string {
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(createdAt))) / 86_400_000)
    if (diffDays <= 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    return `Il y a ${diffDays} jours`
}

/**
 * Groupe par date relative, en préservant l'ordre d'entrée — `notifications`
 * doit déjà être trié du plus récent au plus ancien (voir getMyNotifications)
 * pour que les groupes apparaissent dans le bon ordre.
 */
export function groupNotificationsByDate(notifications: AppNotification[]): NotificationGroup[] {
    const groups = new Map<string, AppNotification[]>()
    for (const notification of notifications) {
        const label = getRelativeDayLabel(notification.createdAt)
        const existing = groups.get(label) ?? []
        existing.push(notification)
        groups.set(label, existing)
    }
    return Array.from(groups.entries()).map(([label, groupNotifications]) => ({
        label,
        notifications: groupNotifications,
    }))
}

/** "Il y a 2 h" / "Hier à 14:22" / "Il y a 3 jours" — horodatage précis d'un item, distinct du label de groupe */
export function formatNotificationTimeLabel(createdAt: string): string {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffHours < 1) return "À l'instant"
    if (diffHours < 24) return `Il y a ${diffHours} h`

    if (getRelativeDayLabel(createdAt) === "Hier") {
        const time = new Date(createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
        return `Hier à ${time}`
    }
    return `Il y a ${diffDays} jours`
}

export function getUnreadCount(notifications: AppNotification[]): number {
    return notifications.filter((notification) => !notification.readAt).length
}
