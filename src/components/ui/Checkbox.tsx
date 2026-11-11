import { ReactNode, type InputHTMLAttributes } from "react"
import styles from "./Checkbox.module.css"

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label: ReactNode
}

export default function Checkbox({ label, id, ...rest }: CheckboxProps) {
    return (
        <label htmlFor={id} className={styles.wrapper}>
            <input id={id} type="checkbox" className={styles.checkbox} {...rest} />
            <span className={styles.label}>{label}</span>
        </label>
    )
}
