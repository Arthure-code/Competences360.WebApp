import styles from "./CardAttributionFooter.module.css"

interface CardAttributionFooterProps {
    attributionLabel: string
    /** Badge optionnel au-dessus de l'attribution — ex. "En attente d'officialisation" (formateur) */
    pendingBadgeLabel?: string
}

/**
 * Partagé entre ContentModuleCard (formateur) et ModuleCard (apprenant) —
 * les deux cartes affichent la même info d'attribution ("Par {org} — créé
 * par {nom}", voir lib/contentModules.ts:getAttributionLabel), même si le
 * reste de chaque carte répond à une question différente (cycle éditorial
 * vs progression d'apprentissage) et reste volontairement séparé.
 */
export default function CardAttributionFooter({ attributionLabel, pendingBadgeLabel }: CardAttributionFooterProps) {
    return (
        <div className={styles.footer}>
            {pendingBadgeLabel && <span className={styles.pendingBadge}>{pendingBadgeLabel}</span>}
            <span className={styles.attribution}>{attributionLabel}</span>
        </div>
    )
}
