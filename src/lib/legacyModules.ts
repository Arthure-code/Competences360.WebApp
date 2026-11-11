import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import { computeCategoryProgress } from "./progress"

const MODULE_STATUS_PRIORITY: Record<Module["status"], number> = {
    late: 0,
    "in-progress": 1,
    todo: 2,
    done: 3,
}

export function getFeaturedModules(
    modules: Module[],
    limit = 3,
): Module[] {
    return [...modules]
        .filter((module) => module.assigned)
        .sort((a, b) => {
            if (MODULE_STATUS_PRIORITY[a.status] !== MODULE_STATUS_PRIORITY[b.status]) {
                return MODULE_STATUS_PRIORITY[a.status] - MODULE_STATUS_PRIORITY[b.status]
            }

            if (a.status === "in-progress") {
                return b.progressPercent - a.progressPercent
            }

            return 0
        })
        .slice(0, limit)
}

/**
 * Sous-ensemble de `modules` correspondant à `ids`, trié par la même
 * priorité de statut que getFeaturedModules (en retard → en cours → à
 * faire → terminé) — pour un ordre cohérent partout où une liste de
 * modules assignés est affichée (page groupe, futur parcours, etc.).
 */
export function getModulesByIds(modules: Module[], ids: string[]): Module[] {
    const idSet = new Set(ids)
    return modules
        .filter((module) => idSet.has(module.id))
        .sort((a, b) => MODULE_STATUS_PRIORITY[a.status] - MODULE_STATUS_PRIORITY[b.status])
}

export interface CategoryModuleGroup {
    category: Category
    modules: Module[]
}

/**
 * Modules assignés groupés par catégorie, en conservant la liste complète
 * (pas juste l'agrégat comme getCategoryStats) — pour "Détails par
 * module", qui affiche chaque module individuellement sous sa catégorie.
 */
export function getModulesByCategoryGrouped(categories: Category[], modules: Module[]): CategoryModuleGroup[] {
    return categories
        .map((category) => ({
            category,
            modules: modules.filter((module) => module.categoryId === category.id && module.assigned),
        }))
        .filter((group): group is CategoryModuleGroup => group.modules.length > 0)
}

export interface CategoryStats {
    category: Category
    modulesCompleted: number
    modulesTotal: number
    progressPercent: number
}

/**
 * Regroupe les modules assignés par catégorie et calcule leurs stats
 * d'agrégation — dynamique (3 comme 10 catégories, aucune en dur). Une
 * catégorie sans module assigné est exclue plutôt qu'affichée à 0%, pour
 * ne montrer que ce qui concerne vraiment l'apprenant.
 */
export function getCategoryStats(categories: Category[], modules: Module[]): CategoryStats[] {
    return categories
        .map((category) => {
            const categoryModules = modules.filter(
                (module) => module.categoryId === category.id && module.assigned,
            )
            if (categoryModules.length === 0) return null

            return {
                category,
                modulesCompleted: categoryModules.filter((module) => module.status === "done").length,
                modulesTotal: categoryModules.length,
                progressPercent: computeCategoryProgress(categoryModules.map((module) => module.progressPercent)),
            }
        })
        .filter((stat): stat is CategoryStats => stat !== null)
}

/**
 * Fusionné depuis utils.ts — seule fonction de ce fichier, un nom
 * fourre-tout qui aurait fini par accumuler du code sans rapport. Sa
 * vraie place est ici, avec le reste des utilitaires Module/Niveau.
 */
export function stripNiveauPrefix(title: string): string {
    return title.replace(/^Niveau\s+\d+\s*:\s*/i, "")
}