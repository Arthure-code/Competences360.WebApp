import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import { resolveIcon } from "@/lib/iconRegistry"
import styles from "./ModuleCategoryCard.module.css"

interface ModuleCategoryCardProps {
    /** Nom d'icône FontAwesome (ex. "faBookOpen"), résolu via lib/icon-registry */
    iconName: string
    /** Couleur hex de la catégorie */
    color: string
    title: string
    description: string
    /** 0-100 */
    progressPercent: number
    modulesCount: number
    href: string
}

export default function ModuleCategoryCard({
    iconName,
    color,
    title,
    description,
    progressPercent,
    modulesCount,
    href,
}: ModuleCategoryCardProps) {
    const icon = resolveIcon(iconName)

    return (
        <Card
            href={href}
            interactive
            padding="md"
            className={styles.card}
            style={{ "--category-color": color } as React.CSSProperties}
        >
            <div className={styles.header}>
                <div className={styles.iconTile}>
                    <FontAwesomeIcon icon={icon} className={styles.icon} aria-hidden="true" />
                </div>

                <h3 className={styles.title}>{title}</h3>
            </div>
            <p className={styles.description}>{description}</p>

            <ProgressBar
                value={progressPercent}
                ariaLabel={`Progression — ${title}`}
                fillClassName={styles.progressFill}
            />

            <div className={styles.footer}>
                <span>Complété : {progressPercent}%</span>
                <span>{modulesCount} modules disponibles</span>
            </div>
        </Card>
    )
}