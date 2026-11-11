import type { ReactNode } from "react"
import styles from "./PageHeader.module.css"

interface PageHeaderProps {
    title: string
    subtitle?: string
    /** Contenu au-dessus du titre — ex. badge de catégorie + bouton audio */
    eyebrow?: React.ReactNode
    /** Aligné à droite, même ligne que l'eyebrow — ex. badge de statut */
    actions?: React.ReactNode
    /** Aligné à droite du bloc titre/sous-titre — ex. barre de progression */
    aside?: React.ReactNode
    className?: string
}

/**
 * En-tête de page réutilisable. Couvre deux cas :
 * - simple : juste `title` + `subtitle` (ex. page catalogue Modules)
 * - riche : `eyebrow`/`actions` au-dessus, `aside` à droite du titre (ex. page module)
 * Les pages avec une mise en page vraiment différente (centrée, sans zone
 * actions à droite — ex. page d'entrée d'un niveau) gardent leur propre markup.
 */
export default function PageHeader({
    title,
    subtitle,
    eyebrow,
    actions,
    aside,
    className = "",
}: PageHeaderProps) {
    return (
        <header className={`${styles.header} ${className}`}>
            {(eyebrow || actions) && (
                <div className={styles.topRow}>
                    <div className={styles.eyebrow}>{eyebrow}</div>
                    {actions && <div className={styles.actions}>{actions}</div>}
                </div>
            )}
            <div className={styles.mainRow}>
                <div className={styles.titleBlock}>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                {aside && <div className={styles.aside}>{aside}</div>}
            </div>
        </header>
    )
}