import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { resolveIcon } from "@/lib/iconRegistry"
import Button from "@/components/ui/Button"
import { formatNotificationTimeLabel } from "@/lib/notifications"
import type { AppNotification } from "@/types/appNotification"
import styles from "./NotificationItem.module.css"

interface NotificationItemProps {
    notification: AppNotification
    /** Appelé au clic sur l'item, seulement si non lue — pas de rappel inutile sur un item déjà lu */
    onMarkAsRead?: () => void
}

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    function handleClick() {
        if (!notification.readAt) onMarkAsRead?.()
    }

    return (
        <div
            className={`${styles.item} ${!notification.readAt ? styles.unread : ""}`}
            onClick={handleClick}
        >
            <div className={styles.iconBox}>
                <FontAwesomeIcon icon={resolveIcon(notification.icon)} aria-hidden="true" />
            </div>

            <div className={styles.content}>
                <div className={styles.headerRow}>
                    <h3 className={styles.title}>{notification.title}</h3>
                    <span className={styles.time}>{formatNotificationTimeLabel(notification.createdAt)}</span>
                </div>

                <p className={styles.description}>{notification.description}</p>

                {notification.actionLabel && notification.actionHref && (
                    <Button
                        label={`${notification.actionLabel} →`}
                        variant="outline"
                        size="sm"
                        href={notification.actionHref}
                        className={styles.action}
                    />
                )}
            </div>
        </div>
    )
}