import { type InputHTMLAttributes, type ReactNode } from "react"
import styles from "./Input.module.css"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    labelAction?: ReactNode
    rightElement?: ReactNode
}

export default function Input({ label, labelAction, rightElement, id, ...rest }: InputProps) {
    return (
        <div className={styles.field}>
            <div className={styles.labelRow}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
                {labelAction}
            </div>
            <div className={styles.inputWrapper}>
                <input id={id} className={rightElement ? `${styles.input} ${styles.inputWithRightElement}` : styles.input} {...rest} />
                {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
            </div>
        </div>
    )
}
