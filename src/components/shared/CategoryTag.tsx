import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { resolveIcon } from "@/lib/iconRegistry"
import styles from "./CategoryTag.module.css"

interface CategoryTagProps {
    /** Résolus par l'appelant (ex. getCategoryById côté serveur) — CategoryTag reste synchrone/présentational, jamais de fetch interne, pour rester utilisable peu importe où il finit dans l'arbre (serveur ou client). */
    label: string
    color: string
    iconName: string
    className?: string
}

/** Pastille catégorie (icône + libellé, teintée de la couleur de la catégorie). */
export default function CategoryTag({ label, color, iconName, className = "" }: CategoryTagProps) {
    const icon = resolveIcon(iconName)

    return (
        <span
            className={`${styles.categoryTag} ${className}`}
            style={{ "--category-color": color } as React.CSSProperties}
        >
            <FontAwesomeIcon icon={icon} className={styles.categoryIcon} aria-hidden="true" />
            {label}
        </span>
    )
}