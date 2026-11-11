import styles from "./SettingsPath.module.css"

interface SettingsPathProps {
    steps: string[]
}

export default function SettingsPath({ steps }: SettingsPathProps) {
    return (
        <div className={styles.path}>
            {steps.map((step, index) => (
                <span key={step} className={styles.step}>
                    {index > 0 && <span className={styles.arrow}>→</span>}
                    {step}
                </span>
            ))}
        </div>
    )
}
