import Link from "next/link"
import styles from "./Card.module.css"

type CardPadding = "none" | "sm" | "md" | "lg"

interface CardProps {
    children: React.ReactNode
    padding?: CardPadding
    interactive?: boolean
    highlighted?: boolean
    href?: string
    onClick?: () => void
    className?: string
    style?: React.CSSProperties
}

/**
 * Bloc visuel de base (fond, bordure, radius) partagé par toutes les cartes
 * du produit : carte de bienvenue, catégories de modules, lignes assignées, etc.
 * Rendu polymorphe : <Link> si `href`, <button> si `onClick`, sinon <div>.
 */
export default function Card({
    children,
    padding = "md",
    interactive = false,
    highlighted = false,
    href,
    onClick,
    className = "",
    style,
}: CardProps) {
    const classes = [
        styles.card,
        styles[`padding-${padding}`],
        interactive ? styles.interactive : "",
        highlighted ? styles.highlighted : "",
        className,
    ]
        .filter(Boolean)
        .join(" ")

    if (href) {
        return (
            <Link href={href} className={classes} style={style}>
                {children}
            </Link>
        )
    }

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes} style={style}>
                {children}
            </button>
        )
    }

    return (
        <div className={classes} style={style}>
            {children}
        </div>
    )
}