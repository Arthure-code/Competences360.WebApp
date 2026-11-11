import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import { routes } from "@/constants/routes"
import type { Group } from "@/types/group"
import styles from "./FormateurGroupListItem.module.css"

interface FormateurGroupListItemProps {
    group: Group
    memberCount: number
    averageProgress: number
    lateCount: number
}

export default function FormateurGroupListItem({
    group,
    memberCount,
    averageProgress,
    lateCount,
}: FormateurGroupListItemProps) {
    return (
        <Card href={routes.formateur.groupes.bySlug(group.slug)} interactive padding="md" className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.name}>{group.name}</h3>
                {lateCount > 0 && (
                    <span className={styles.lateBadge}>
                        {lateCount} en retard
                    </span>
                )}
            </div>

            <p className={styles.meta}>
                {memberCount} apprenant{memberCount > 1 ? "s" : ""}
            </p>

            <div className={styles.progressRow}>
                <ProgressBar
                    value={averageProgress}
                    ariaLabel={`Progression moyenne — ${group.name}`}
                    className={styles.progressBar}
                />
                <span className={styles.progressLabel}>{averageProgress}% en moyenne</span>
            </div>
        </Card>
    )
}
