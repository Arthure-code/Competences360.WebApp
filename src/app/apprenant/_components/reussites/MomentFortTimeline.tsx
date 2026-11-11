import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { resolveIcon } from "@/lib/iconRegistry"
import { formatLongDateLabel } from "@/lib/date"
import Card from "@/components/ui/Card"
import type { MomentFortDisplay } from "@/lib/rewards"
import styles from "./MomentFortTimeline.module.css"

interface MomentFortTimelineProps {
    items: MomentFortDisplay[]
}

export default function MomentFortTimeline({ items }: MomentFortTimelineProps) {
    return (
        <Card padding="lg" className={styles.card}>
            {items.map((item, index) => (
                <div key={`${item.label}-${item.earnedAt}-${index}`} className={styles.item}>
                    <div className={styles.iconColumn}>
                        <div className={styles.iconCircle}>
                            <FontAwesomeIcon icon={resolveIcon(item.icon)} aria-hidden="true" />
                        </div>
                        {index < items.length - 1 && <div className={styles.line} />}
                    </div>

                    <div className={styles.content}>
                        <div className={styles.headerRow}>
                            <h3 className={styles.label}>{item.label}</h3>
                            <span className={styles.date}>{formatLongDateLabel(item.earnedAt)}</span>
                        </div>
                        {item.description && <p className={styles.description}>{item.description}</p>}
                    </div>
                </div>
            ))}
        </Card>
    )
}
