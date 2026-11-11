import Link from "next/link"
import { faChevronDown, faArrowRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./PageSubheader.module.css"

type ActionMode = "link" | "toggle" | "action" | "none"

interface PageSubheaderProps {
    title: string
    /** Optionnel — affiché en span séparé après le titre, ex. "(10)" — stylable via countClassName */
    count?: number
    /** Surcharge le style par défaut du compteur (muted par défaut) */
    countClassName?: string
    /** Optionnel — ex. "Progressez à votre rythme, de novice à expert." sous "Les niveaux" */
    subtitle?: string
    className?: string
    /** Surcharge locale du style du titre (ex. plus petit/uppercase dans un contexte spécifique) */
    titleClassName?: string
    /** Texte simple aligné à droite, non cliquable — ex. "4 modules au total". Mutuellement exclusif avec actionLabel. */
    meta?: string
    /** Style le lien d'action en gris atténué, ex. quand la section correspondante n'est pas encore prête */
    muted?: boolean

    actionLabel?: string
    /** Requis si le mode résolu est "link" */
    actionHref?: string
    /** Requis si le mode résolu est "toggle" */
    onActionClick?: () => void
    /**
     * "link" — navigue vers actionHref, icône fixe et décorative (ex. "Voir
     * tout" vers le catalogue complet des modules).
     * "toggle" — replie/déplie une section locale, l'icône tourne à 180°
     * selon `isOpen` (voir CollapsibleSection, qui pilote ce mode
     * explicitement — jamais déduit automatiquement).
     * "action" — déclenche un comportement personnalisé (ex. ouvrir un
     * SidePanel) sans lien ni repli — icône fixe comme "link", mais un
     * bouton plutôt qu'un <Link>.
     * Déduit automatiquement si non fourni : actionHref -> "link", sinon
     * onActionClick -> "action".
     */
    actionMode?: ActionMode
    /** Pertinent uniquement en mode "toggle" — pilote la rotation de l'icône */
    isOpen?: boolean
    actionAriaControls?: string
}

export default function PageSubheader({
    title,
    count,
    countClassName = "",
    subtitle,
    className = "",
    titleClassName = "",
    meta,
    muted = false,
    actionLabel,
    actionHref,
    onActionClick,
    actionMode,
    isOpen = false,
    actionAriaControls,
}: PageSubheaderProps) {
    const resolvedMode: ActionMode = actionMode ?? (actionHref ? "link" : onActionClick ? "action" : "none")
    const actionClassName = `${styles.action} ${muted ? styles.mutedAction : ""}`

    return (
        <div className={`${styles.header} ${className}`}>
            <div className={styles.titleGroup}>
                <h2 className={`${styles.title} ${titleClassName}`}>
                    {title}
                    {count !== undefined && <span className={`${styles.count} ${countClassName}`}> ({count})</span>}
                </h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {meta && <span className={styles.meta}>{meta}</span>}

            {actionLabel && resolvedMode === "link" && actionHref && (
                <Link href={actionHref} className={actionClassName}>
                    {actionLabel}
                    <FontAwesomeIcon icon={faArrowRight} className={styles.actionIcon} aria-hidden="true" />
                </Link>
            )}

            {actionLabel && resolvedMode === "action" && (
                <button type="button" className={actionClassName} onClick={onActionClick}>
                    {actionLabel}
                    <FontAwesomeIcon icon={faArrowRight} className={styles.actionIcon} aria-hidden="true" />
                </button>
            )}

            {actionLabel && resolvedMode === "toggle" && (
                <button
                    type="button"
                    className={actionClassName}
                    onClick={onActionClick}
                    aria-expanded={isOpen}
                    aria-controls={actionAriaControls}
                >
                    {actionLabel}
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`${styles.actionIcon} ${isOpen ? styles.actionIconOpen : ""}`}
                        aria-hidden="true"
                    />
                </button>
            )}
        </div>
    )
}