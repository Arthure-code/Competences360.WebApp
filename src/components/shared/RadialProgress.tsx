"use client"

import styles from "./RadialProgress.module.css"

interface RadialProgressProps {
    /** Valeur entre 0 et 100 */
    value: number
    ariaLabel?: string
    /**
     * Unités internes du viewBox — détermine seulement les proportions
     * (épaisseur du trait relative au rayon), PAS la taille réelle affichée.
     * Le composant remplit toujours 100% de son conteneur (voir CSS) ; pour
     * contrôler sa taille réelle, donner une largeur au conteneur via
     * `className` (ex. width/max-width en CSS), pas via ce prop.
     */
    size?: number
    strokeWidth?: number
    /** Couleur du trait de progression — défaut : --color-primary */
    color?: string
    /** Texte affiché au centre — défaut : "{value}%" */
    label?: string
    className?: string
}

/**
 * Anneau de progression réservé aux métriques uniques (une seule valeur
 * globale, ex. "% du parcours complété") — pas pour une liste de N éléments
 * (catégories, modules...), où un radial par ligne prend trop de place et
 * se compare moins bien qu'une barre horizontale alignée. Voir
 * CategoryProgressRow pour ce second cas.
 *
 * Toujours fluide : remplit 100% de la largeur/hauteur de son conteneur
 * (aspect-ratio 1/1 pour rester rond), texte au centre mis à l'échelle via
 * des unités de container query. C'est au conteneur parent (via className
 * ou le layout de la page) de décider de l'espace qui lui est alloué.
 */
export default function RadialProgress({
    value,
    ariaLabel,
    size = 104,
    strokeWidth = 10,
    color,
    label,
    className = "",
}: RadialProgressProps) {
    const clamped = Math.min(100, Math.max(0, value))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - clamped / 100)

    return (
        <div
            className={`${styles.wrapper} ${className}`}
            role="img"
            aria-label={ariaLabel ?? `${clamped}%`}
        >
            <svg viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className={styles.track}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    className={styles.fill}
                    style={{
                        stroke: color ?? "var(--color-primary)",
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <span className={styles.label} aria-hidden="true">
                {label ?? `${clamped}%`}
            </span>
        </div>
    )
}