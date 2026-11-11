import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import styles from "./IconFeatureGrid.module.css"

export interface IconFeatureItem {
    icon: IconProp
    title: string
    description: string
}

interface IconFeatureGridProps {
    items: IconFeatureItem[]
    variant?: "positive" | "negative"
}

export default function IconFeatureGrid({ items, variant = "positive" }: IconFeatureGridProps) {
    return (
        <div className={styles.grid}>
            {items.map((item) => (
                <div key={item.title} className={styles.card}>
                    <span className={`${styles.iconWrap} ${variant === "negative" ? styles.iconWrapNegative : ""}`}>
                        <FontAwesomeIcon
                            icon={variant === "negative" ? faXmark : item.icon}
                            className={styles.icon}
                            aria-hidden="true"
                        />
                    </span>
                    <div>
                        <h3 className={styles.title}>{item.title}</h3>
                        <p className={styles.description}>{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
