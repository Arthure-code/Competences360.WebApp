import PageSubheader from "@/components/ui/PageSubheader"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { Category } from "@/types/category"
import styles from "./ModuleSummaryTab.module.css"

interface ModuleSummaryTabProps {
    version: ModuleVersion
    categories: Category[]
}

const DIFFICULTY_LABELS: Record<string, string> = {
    novice: "Novice",
    intermediaire: "Intermédiaire",
    expert: "Expert",
}

/**
 * Vue d'ensemble sans ouvrir l'éditeur — "toutes les infos, c'est quoi le
 * contenu etc." en un coup d'œil.
 */
export default function ModuleSummaryTab({ version, categories }: ModuleSummaryTabProps) {
    const category = categories.find((c) => c.id === version.content.categoryId)

    return (
        <div className={styles.tab}>
            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Catégorie</span>
                    <span className={styles.infoValue}>{category?.label ?? "—"}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Activités</span>
                    <span className={styles.infoValue}>{version.content.niveaux.length}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Exercices au total</span>
                    <span className={styles.infoValue}>
                        {version.content.niveaux.reduce((sum, n) => sum + n.exercises.length, 0)}
                    </span>
                </div>
            </div>

            <PageSubheader title="Activités" count={version.content.niveaux.length} />

            {version.content.niveaux.length === 0 ? (
                <p className={styles.empty}>Aucune activité pour l'instant.</p>
            ) : (
                <div className={styles.activityList}>
                    {version.content.niveaux.map((niveau) => (
                        <div key={niveau.id} className={styles.activityRow}>
                            <div className={styles.activityInfo}>
                                <span className={styles.activityTitle}>{niveau.title || "Sans titre"}</span>
                            </div>
                            <div className={styles.activityMeta}>
                                <span className={styles.difficultyBadge}>{DIFFICULTY_LABELS[niveau.difficulty]}</span>
                                <span className={styles.exerciseCount}>
                                    {niveau.exercises.length} exercice{niveau.exercises.length > 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}