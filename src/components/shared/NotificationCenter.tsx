"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SidePanel from "@/components/ui/SidePanel"
import NotificationItem from "./NotificationItem"
import { marquerNotificationLue, marquerToutesLues } from "@/_mocks/notifications.actions"
import { groupNotificationsByDate, getUnreadCount } from "@/lib/notifications"
import type { AppNotification } from "@/types/appNotification"
import styles from "./NotificationCenter.module.css"

interface NotificationCenterProps {
    isOpen: boolean
    onClose: () => void
    notifications: AppNotification[]
}

/**
 * La lecture est persistée sur l'API (`PUT /api/notifications/{id}/lue`).
 * C'était un état local : on marquait tout comme lu, et la pastille revenait
 * au rechargement, avec le même compte qu'avant.
 *
 * L'affichage est mis à jour SANS attendre la réponse — cocher une
 * notification comme lue est anodin, et une pastille qui met une seconde à
 * s'éteindre donne l'impression d'un clic perdu. En cas d'échec, on remet
 * l'état d'avant plutôt que de mentir.
 *
 * `router.refresh()` à la fermeture : le compteur de la cloche vient du
 * layout (Server Component), qui ne se recalcule pas tout seul.
 */
export default function NotificationCenter({
    isOpen,
    onClose,
    notifications: initialNotifications,
}: NotificationCenterProps) {
    const router = useRouter()
    const [notifications, setNotifications] = useState(initialNotifications)
    const unreadCount = getUnreadCount(notifications)
    const groups = groupNotificationsByDate(notifications)

    async function handleMarkAllAsRead() {
        const nonLues = notifications.filter((n) => !n.readAt).map((n) => n.id)
        if (nonLues.length === 0) return

        const avant = notifications
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.readAt ? notification : { ...notification, readAt: new Date().toISOString() }
            )
        )

        const resultat = await marquerToutesLues(nonLues)

        if (!resultat.succes) setNotifications(avant)
    }

    async function handleMarkAsRead(id: string) {
        const cible = notifications.find((n) => n.id === id)
        if (!cible || cible.readAt) return

        const avant = notifications
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === id
                    ? { ...notification, readAt: new Date().toISOString() }
                    : notification
            )
        )

        const resultat = await marquerNotificationLue(id)

        if (!resultat.succes) setNotifications(avant)
    }

    function handleClose() {
        onClose()
        router.refresh()
    }

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={handleClose}
            title="Notifications"
            subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
            headerAction={
                unreadCount > 0 && (
                    <button type="button" className={styles.markAllRead} onClick={handleMarkAllAsRead}>
                        Tout marquer comme lu
                    </button>
                )
            }
        >
            {groups.map((group) => (
                <div key={group.label} className={styles.group}>
                    <p className={styles.groupLabel}>{group.label.toUpperCase()}</p>
                    <div className={styles.groupItems}>
                        {group.notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </SidePanel>
    )
}