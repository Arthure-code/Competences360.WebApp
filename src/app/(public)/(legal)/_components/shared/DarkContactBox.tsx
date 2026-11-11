import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconProp } from "@fortawesome/fontawesome-svg-core"
import styles from "./DarkContactBox.module.css"

export interface DarkContactLine {
    icon?: IconProp
    text: React.ReactNode
}

interface DarkContactBoxProps {
    align?: "center" | "left"
    intro?: string
    lines: DarkContactLine[]
}

export default function DarkContactBox({ align = "left", intro, lines }: DarkContactBoxProps) {
    return (
        <div className={`${styles.box} ${align === "center" ? styles.center : styles.left}`}>
            {intro && <p className={styles.intro}>{intro}</p>}
            <div className={styles.lines}>
                {lines.map((line, index) => (
                    <p key={index} className={styles.line}>
                        {line.icon && (
                            <FontAwesomeIcon icon={line.icon} className={styles.icon} aria-hidden="true" />
                        )}
                        {line.text}
                    </p>
                ))}
            </div>
        </div>
    )
}
