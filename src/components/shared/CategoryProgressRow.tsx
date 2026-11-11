import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import ProgressBar from "@/components/ui/ProgressBar"
import { resolveIcon } from "@/lib/iconRegistry"
import type { CategoryStats } from "@/lib/legacyModules"
import styles from "./CategoryProgressRow.module.css"

interface CategoryProgressRowProps {
    stats: CategoryStats
}

export default function CategoryProgressRow({ stats }: CategoryProgressRowProps) {
    const { category, modulesCompleted, modulesTotal, progressPercent } = stats

    return (
        <div className={styles.row}>
            <div
                className={styles.iconBox}
                style={{ backgroundColor: `${category.color}1A`, color: category.color }}
            >
                <FontAwesomeIcon icon={resolveIcon(category.iconName)} aria-hidden="true" />
            </div>

            <div className={styles.content}>
                <div className={styles.headerRow}>
                    <span className={styles.label}>{category.label}</span>
                    <span className={styles.percent} style={{ color: category.color }}>
                        {progressPercent}%
                    </span>
                </div>

                <ProgressBar
                    value={progressPercent}
                    ariaLabel={`Progression — ${category.label}`}
                    className={styles.bar}
                    fillClassName={styles.barFill}
                    style={{ "--fill-color": category.color } as React.CSSProperties}
                />

                <span className={styles.caption}>
                    {modulesCompleted}/{modulesTotal} module{modulesTotal > 1 ? "s" : ""} complété
                    {modulesCompleted > 1 ? "s" : ""}
                </span>
            </div>
        </div>
    )
}