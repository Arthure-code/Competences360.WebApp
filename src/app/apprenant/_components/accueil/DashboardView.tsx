"use client"

import { useMemo } from "react"
import HeroSection from "@/app/apprenant/_components/accueil/HeroSection"
import ContinueLearningCard from "@/app/apprenant/_components/accueil/ContinueLearningCard"
import AssignedModulesSection from "@/app/apprenant/_components/accueil/AssignedModulesSection"
import UpcomingDeadlinesSection from "@/app/apprenant/_components/accueil/UpcomingDeadlinesSection"
import ExploreModulesSection from "@/app/apprenant/_components/accueil/ExploreModulesSection"
import { useHydratedModules } from "@/hooks/useHydratedModules"
import { findResumeTarget } from "@/lib/apprenantDashboard"
import { getFeaturedModules } from "@/lib/legacyModules"
import { computeCategoryProgress } from "@/lib/progress"
import { routes } from "@/constants/routes"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Deadline } from "@/types/deadline"
import type { Category } from "@/types/category"
import type { ApprenantModuleProgressEntry } from "@/types/apprenantModuleProgress"
import styles from "./DashboardView.module.css"

interface DashboardViewProps {
    firstName: string
    assignedResults: AssignedModuleResult[]
    deadlines: Deadline[]
    categories: Category[]
    /** Voir apprenantModuleProgress.mock.ts — permet à findResumeTarget de choisir le module vraiment le plus récemment actif, pas juste le premier trouvé (voir lib/apprenantDashboard.ts) */
    progressEntries: ApprenantModuleProgressEntry[]
}

/**
 * "Reprendre ici", "Modules assignés" ET les stats par catégorie
 * ("Explorer") dépendent tous de localStorage (voir hydrateModuleProgress),
 * inaccessible côté serveur — même schéma que ModulesView (1er rendu =
 * progression neutre venant du serveur, réhydraté au montage ET à la
 * reprise de focus, voir useHydratedModules). Remplace dashboard.mock.ts
 * (getDashboardData), jamais relié aux vraies assignations.
 *
 * Contrairement à getCategoryStats (lib/modules.ts, utilisé par Parcours
 * "Détails par module"), les catégories sans module assigné restent
 * affichées ici à 0% plutôt qu'exclues — "Explorer" sert justement à
 * découvrir des catégories pas encore commencées, les cacher irait à
 * l'encontre du but de cette section.
 */
export default function DashboardView({ firstName, assignedResults, deadlines, categories, progressEntries }: DashboardViewProps) {
    const modules = useHydratedModules(assignedResults)

    const resumeTarget = findResumeTarget(modules, progressEntries)
    const featuredModules = getFeaturedModules(modules)

    const categoriesWithStats = useMemo(
        () =>
            categories.map((category) => {
                const categoryModules = modules.filter((m) => m.categoryId === category.id)
                return {
                    ...category,
                    modulesCount: categoryModules.length,
                    progressPercent: computeCategoryProgress(categoryModules.map((m) => m.progressPercent)),
                }
            }),
        [categories, modules]
    )

    return (
        <div className={styles.page}>
            <HeroSection firstName={firstName} />

            <div className={styles.twoColumnRow}>
                <div className={styles.areaContinue}>
                    {resumeTarget ? (
                        <ContinueLearningCard
                            status="in-progress"
                            savedAtLabel="Reprendre"
                            questionProgressLabel={resumeTarget.questionProgressLabel}
                            exerciseTitle={resumeTarget.exerciseTitle}
                            progressPercent={resumeTarget.progressPercent}
                            resumeHref={resumeTarget.resumeHref}
                        />
                    ) : (
                        <ContinueLearningCard status="empty" exploreHref={routes.apprenant.modules.root} />
                    )}
                </div>

                <div className={styles.areaAssigned}>
                    <AssignedModulesSection modules={featuredModules} categories={categories} />
                </div>

                <div className={styles.areaDeadlines}>
                    <UpcomingDeadlinesSection deadlines={deadlines} categories={categories} />
                </div>
            </div>

            <ExploreModulesSection categories={categoriesWithStats} />
        </div>
    )
}