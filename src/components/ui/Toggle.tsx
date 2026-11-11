import styles from "./Toggle.module.css"

interface ToggleProps {
    checked: boolean
    onChange?: (checked: boolean) => void
    disabled?: boolean
    label: string
}

export default function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange?.(!checked)}
            className={`${styles.track} ${checked ? styles.trackChecked : ""} ${
                disabled ? styles.trackDisabled : ""
            }`}
        >
            <span className={`${styles.thumb} ${checked ? styles.thumbChecked : ""}`} />
        </button>
    )
}