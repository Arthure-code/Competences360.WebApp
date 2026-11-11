import Link from 'next/link'
import styles from './Button.module.css'

interface ButtonProps {
    label: string
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onClick?: () => void
    /** Si fourni, le bouton devient un lien Next.js vers cette route (au lieu d'un <button>) */
    href?: string
    className?: string
}

export default function Button({
    label,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    type = 'button',
    onClick,
    href,
    className = '',
}: ButtonProps) {
    const computedClassName = [
        styles.button,
        styles[variant],
        size !== 'md' ? styles[size] : '',
        fullWidth ? styles.fullWidth : '',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    if (href) {
        return (
            <Link href={href} className={computedClassName} aria-disabled={disabled} onClick={onClick}>
                {label}
            </Link>
        )
    }

    return (
        <button
            type={type}
            className={computedClassName}
            disabled={disabled}
            onClick={onClick}
        >
            {label}
        </button>
    )
}
// Résumé en une ligne chacun=================
// primary: Le plus fort = "Fais ceci." (un seul primary par page/section)
// secondary: Fort, mais en retrait" Ou ceci, tout aussi valide."
// outline: Moyen, neutre = "Cette option existe."
// ghost: Le plus faible = "Disponible, sans pression."
// danger: Fort mais alarmant = "Attention, c'est définitif."