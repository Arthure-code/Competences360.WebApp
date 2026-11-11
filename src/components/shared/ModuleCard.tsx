import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import AssignmentStatusBadge from "@/components/shared/AssignmentStatusBadge"
import CategoryTag from "@/components/shared/CategoryTag"
import { routes } from "@/constants/routes"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./ModuleCard.module.css"

interface ModuleCardProps {
    module: Module
    /** Résolue par l'appelant (getCategoryById) — absente = repli neutre plutôt qu'un plantage */
    category?: Category
}

const FALLBACK_COLOR = "#6E6E73"

export default function ModuleCard({ module, category }: ModuleCardProps) {
    return (
        <Card
            href={routes.apprenant.modules.bySlug(module.slug)}
            interactive
            highlighted={module.status === "late"}
            padding="md"
            className={styles.card}
        >
            <div className={styles.contentColumn}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>{module.title}</h3>
                    <CategoryTag
                        label={category?.label ?? "Catégorie"}
                        color={category?.color ?? FALLBACK_COLOR}
                        iconName={category?.iconName ?? "faTag"}
                    />
                </div>

                <div className={styles.progressRow}>
                    <div className={styles.progressGrp}>
                        <ProgressBar
                            value={module.progressPercent}
                            ariaLabel={`Progression — ${module.title}`}
                            className={styles.progressTrack}
                            fillClassName={styles.progressFill}
                        />

                        <div className={styles.progressRow}>
                            <span className={styles.progressLabel}>
                                {module.progressLabelOverride ?? `${module.progressPercent}% complété`}
                            </span>
                            <div className={styles.iconColumn}>
                                <AssignmentStatusBadge status={module.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}