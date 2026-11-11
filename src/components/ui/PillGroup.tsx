import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./PillGroup.module.css"

export interface PillItem {
    id: string
    label: string
    icon?: IconDefinition
}

interface PillGroupProps {
    items: PillItem[]
    active: string
    onChange: (id: string) => void
    className?: string
}

export default function PillGroup({ items, active, onChange, className = "" }: PillGroupProps) {
    return (
        <div className={`${styles.group} ${className}`} role="group">
            {items.map((item) => {
                const isActive = active === item.id
                return (
                    <button
                        key={item.id}
                        type="button"
                        aria-pressed={isActive}
                        className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
                        onClick={() => onChange(item.id)}
                    >
                        {item.icon && (
                            <FontAwesomeIcon icon={item.icon} className={styles.icon} aria-hidden="true" />
                        )}
                        {item.label}
                    </button>
                )
            })}
        </div>
    )
}
