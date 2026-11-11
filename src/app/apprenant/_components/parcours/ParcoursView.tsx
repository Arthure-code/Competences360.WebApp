"use client"

import PageHeader from "@/components/ui/PageHeader"
import PageSubheader from "@/components/ui/PageSubheader"
import Card from "@/components/ui/Card"
import RadialProgress from "@/components/shared/RadialProgress"
import Notice from "@/components/shared/Notice"
import CategoryProgressRow from "@/components/shared/CategoryProgressRow"
import StatGrid from "@/components/ui/StatGrid"
import CollapsibleGroup from "@/components/shared/CollapsibleGroup"
import ModuleDetailTableHeader from "@/components/shared/ModuleDetailTableHeader"
import ModuleDetailRow from "@/components/shared/ModuleDetailRow"
import { useHydratedModules } from "@/hooks/useHydratedModules"
import { getCategoryStats, getModulesByCategoryGrouped } from "@/lib/legacyModules"
import { getLateModulesNotice } from "@/lib/notices"
import { formatDurationLabel } from "@/lib/progress"
import { useProgression } from "@/hooks/useProgression"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Category } from "@/types/category"
import styles from "./ParcoursView.module.css"

interface ParcoursViewProps {
    assignedResults: AssignedModuleResult[]
    categories: Category[]
}

/**
 * Remplace l'ancien Parcours (MODULES/getAllModules, ancien catalogue
 * statique jamais relié aux vraies assignations) — même schéma que
 * ModulesView/DashboardView : rendu serveur neutre, hydraté au montage ET
 * à la reprise de focus (voir useHydratedModules).
 * getCategoryStats/getModulesByCategoryGrouped (lib/modules.ts) et
 * useProgression (hooks/useProgression.ts) sont déjà agnostiques — ils
 * n'ont jamais eu besoin de changer, seulement d'être nourris avec la
 * vraie liste de modules assignés.
 */
export default function ParcoursView({ assignedResults, categories }: ParcoursViewProps) {
    const modules = useHydratedModules(assignedResults)

    const completedCount = modules.filter((m) => m.status === "done").length
    const totalCount = modules.length
    const globalPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

    const lateCount = modules.filter((m) => m.status === "late").length
    const categoryStats = getCategoryStats(categories, modules)
    const categoryGroups = getModulesByCategoryGrouped(categories, modules)

    const progression = useProgression(modules)
    const timeLabel = formatDurationLabel(progression.totalElapsedMs)

    const statsItems = [
        { id: "time", label: "Temps total de formation", value: timeLabel.value, unit: timeLabel.unit },
        { id: "average", label: "Moyenne globale", value: progression.averageScorePercent, unit: "%" },
        { id: "exercises", label: "Exercices complétés", value: progression.completedExercisesCount },
        { id: "attempts", label: "Tentatives totales", value: progression.totalAttemptsCount },
    ]

    return (
        <div className={styles.page}>
            <PageHeader title="Mon parcours" subtitle="Votre progression en un coup d'œil" />

            <div className={styles.overviewSection}>
                <Card padding="lg" className={styles.overviewCard}>
                    <div className={styles.overviewText}>
                        <p className={styles.overviewTitle}>Progression du parcours</p>
                        <p className={styles.overviewCaption}>
                            {completedCount} module{completedCount > 1 ? "s" : ""} sur {totalCount} complété
                            {completedCount > 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className={styles.overviewProgress}>
                        <RadialProgress
                            value={globalPercent}
                            ariaLabel={`${globalPercent}% du parcours complété`}
                            className={styles.overviewRadial}
                        />
                    </div>
                </Card>

                <Card padding="lg" className={styles.categoriesCard}>
                    {categoryStats.map((stat) => (
                        <CategoryProgressRow key={stat.category.id} stats={stat} />
                    ))}
                </Card>
            </div>

            {lateCount > 0 && <Notice notice={getLateModulesNotice(lateCount)} size="md" />}

            <div className={styles.statsSection}>
                <PageSubheader title="Statistiques personnelles" />
                <StatGrid items={statsItems} />
            </div>

            <div className={styles.detailsSection}>
                <PageSubheader title="Détails par module" />

                <Card padding="none">
                    <ModuleDetailTableHeader />
                    {categoryGroups.map(({ category, modules: groupModules }) => (
                        <CollapsibleGroup
                            key={category.id}
                            label={category.label}
                            className={styles.categoryGroup}
                            triggerClassName={styles.categoryTrigger}
                            showToggleLabel={false}
                        >
                            {groupModules.map((module) => (
                                <ModuleDetailRow key={module.id} module={module} />
                            ))}
                        </CollapsibleGroup>
                    ))}
                </Card>
            </div>
        </div>
    )
}