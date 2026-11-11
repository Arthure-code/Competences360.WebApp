import type { CSSProperties } from "react"
import styles from "./ProgressBar.module.css"

interface ProgressBarProps {
    /** Valeur entre 0 et 100 */
    value: number
    ariaLabel?: string
    className?: string
    fillClassName?: string
    /** Ex. définir --fill-color pour qu'un fillClassName personnalisé la consomme (voir CategoryProgressRow) */
    style?: CSSProperties
}

export default function ProgressBar({
    value,
    ariaLabel,
    className = "",
    fillClassName = "",
    style,
}: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value))

    return (
        <div
            className={`${styles.track} ${className}`}
            style={style}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
        >
            <div
                className={`${styles.fill} ${fillClassName}`}
                style={{ width: `${clamped}%` }}
            />
        </div>
    )
}