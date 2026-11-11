import type { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./RadioCard.module.css"

interface RadioCardProps {
    icon: IconProp
    title: string
    description: string
    selected: boolean
    onSelect: () => void
    name: string
}

export default function RadioCard({ icon, title, description, selected, onSelect, name }: RadioCardProps) {
    return (
        <label className={`${styles.card} ${selected ? styles.cardSelected : ""}`}>
            <input
                type="radio"
                name={name}
                checked={selected}
                onChange={onSelect}
                className={styles.radioInput}
            />
            <span className={`${styles.radioIndicator} ${selected ? styles.radioIndicatorSelected : ""}`} />
            <div className={styles.content}>
                <span className={styles.iconWrap}>
                    <FontAwesomeIcon icon={icon} className={styles.icon} />
                </span>
                <span className={styles.text}>
                    <span className={styles.title}>{title}</span>
                    <span className={styles.description}>{description}</span>
                </span>
            </div>
        </label>
    )
}
