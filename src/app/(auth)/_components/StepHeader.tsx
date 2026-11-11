import type { ReactNode } from "react"
import styles from "./StepHeader.module.css"

interface StepHeaderProps {
    title: string
    subtitle: ReactNode
}

export default function StepHeader({ title, subtitle }: StepHeaderProps) {
    return (
        <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
        </div>
    )
}
