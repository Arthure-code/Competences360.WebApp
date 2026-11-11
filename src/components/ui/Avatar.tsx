import { getInitials } from "@/lib/user"
import styles from "./Avatar.module.css"

interface AvatarProps {
    firstName: string
    lastName: string
    /** Absent = repli sur les initiales */
    avatarUrl?: string
    /** Taille en px (largeur = hauteur) — défaut 40 */
    size?: number
    className?: string
}

/**
 * <img> brut plutôt que next/image : avatarUrl peut être une data URL
 * (aperçu local avant upload réel, voir PersonalInfoCard) que next/image
 * ne gère pas bien, et une vraie URL distante nécessiterait de toute façon
 * une config de domaines qu'on ne connaît pas encore.
 */
export default function Avatar({ firstName, lastName, avatarUrl, size = 40, className = "" }: AvatarProps) {
    return (
        <div
            className={`${styles.avatar} ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={styles.image} />
            ) : (
                getInitials({ firstName, lastName })
            )}
        </div>
    )
}