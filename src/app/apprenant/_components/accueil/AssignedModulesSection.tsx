import { faLayerGroup } from "@fortawesome/free-solid-svg-icons"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import EmptyState from "@/components/ui/EmptyState"
import ModuleCard from "@/components/shared/ModuleCard"
import { routes } from "@/constants/routes"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./AssignedModulesSection.module.css"

interface AssignedModulesSectionProps {
    modules: Module[]
    categories: Category[]
    maxVisible?: number
}

export default function AssignedModulesSection({
    modules,
    categories,
    maxVisible = 3,
}: AssignedModulesSectionProps) {
    const visibleModules = modules.slice(0, maxVisible)

    return (
        <CollapsibleSection
            title="Mes modules assignés"
            actionLabel="Voir tout"
            actionHref={routes.apprenant.modules.filterByStatus("assigned")}
        >
            {modules.length > 0 ? (
                <div className={styles.list}>
                    {visibleModules.map((module) => (
                        <ModuleCard
                            key={module.id}
                            module={module}
                            category={categories.find((c) => c.id === module.categoryId)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={faLayerGroup}
                    title="Vous n'avez pas encore de modules assignés."
                    description="Rejoignez un groupe pour commencer !"
                    bordered
                />
            )}
        </CollapsibleSection>
    )
}