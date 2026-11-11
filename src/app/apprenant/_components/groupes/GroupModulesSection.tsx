"use client"

import PageSubheader from "@/components/ui/PageSubheader"
import ModuleCard from "@/components/shared/ModuleCard"
import { useHydratedModules } from "@/hooks/useHydratedModules"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Category } from "@/types/category"
import styles from "./GroupModulesSection.module.css"

interface GroupModulesSectionProps {
    groupModuleResults: AssignedModuleResult[]
    categories: Category[]
}

/**
 * Manquait à GroupDetailView (composant serveur) : sans ce wrapper client,
 * les modules restaient toujours à l'état neutre venant du serveur
 * (buildStructuralModule, lib/assignedModules.ts) — jamais "en retard",
 * jamais le vrai statut, contrairement à Modules/Accueil/Parcours qui
 * hydratent déjà tous côté client. Même schéma qu'eux, via
 * useHydratedModules (hooks/useHydratedModules.ts).
 */
export default function GroupModulesSection({ groupModuleResults, categories }: GroupModulesSectionProps) {
    const modules = useHydratedModules(groupModuleResults)

    return (
        <div className={styles.modulesSection}>
            <PageSubheader
                title="Modules assignés par ce groupe"
                meta={`${modules.length} module${modules.length > 1 ? "s" : ""} au total`}
            />
            <div className={styles.moduleList}>
                {modules.map((module) => (
                    <ModuleCard key={module.id} module={module} category={categories.find((c) => c.id === module.categoryId)} />
                ))}
            </div>
        </div>
    )
}