import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { resolveIcon } from "@/lib/iconRegistry"
import { getDeadlineUrgency, formatRelativeDeadlineLabel, formatDeadlineDateLabel } from "@/lib/deadlines"
import type { Deadline } from "@/types/deadline"
import styles from "./DeadlineCard.module.css"

interface DeadlineCardProps {
    deadline: Deadline
    categoryLabel: string
    categoryIconName: string
}

export default function DeadlineCard({ deadline, categoryLabel, categoryIconName }: DeadlineCardProps) {
    const urgency = getDeadlineUrgency(deadline.dueDate)
    const relativeLabel = formatRelativeDeadlineLabel(deadline.dueDate)

    return (
        <Card padding="lg" className={`${styles.card} ${styles[urgency]}`}>
            <div className={styles.header}>
                <span className={styles.badge}>
                    {urgency === "urgent" && "Urgent • "}
                    {relativeLabel.toUpperCase()}
                </span>
                <span className={styles.assignedBy}>
                    Assigné par : <strong>{deadline.assignedByName}</strong>
                </span>
            </div>

            <h3 className={styles.title}>{deadline.moduleTitle}</h3>

            <span className={styles.category}>
                <FontAwesomeIcon icon={resolveIcon(categoryIconName)} aria-hidden="true" />
                {categoryLabel}
            </span>

            <div className={styles.footer}>
                <div className={styles.dateGroup}>
                    <span className={styles.dateLabel}>Date d'échéance</span>
                    <span className={styles.dateValue}>{formatDeadlineDateLabel(deadline.dueDate)}</span>
                </div>
                <Button label={`${deadline.actionLabel} →`} variant="primary" href={deadline.href} />
            </div>
        </Card>
    )
}
