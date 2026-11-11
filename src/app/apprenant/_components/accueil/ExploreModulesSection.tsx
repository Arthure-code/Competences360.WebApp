import CollapsibleSection from "@/components/ui/CollapsibleSection"
import ModuleCategoryCard from "@/app/apprenant/_components/accueil/ModuleCategoryCard"
import { routes } from "@/constants/routes"
import styles from "./ExploreModulesSection.module.css"
import Card from "@/components/ui/Card"

interface CategoryWithStats {
    id: string
    iconName: string
    color: string
    label: string
    description: string
    progressPercent: number
    modulesCount: number
}

interface ExploreModulesSectionProps {
    categories: CategoryWithStats[]
}

export default function ExploreModulesSection({ categories }: ExploreModulesSectionProps) {
    return (
        <Card>
            <CollapsibleSection
                title="Explorer les modules"
                actionLabel="Voir tous les modules"
                actionHref={routes.apprenant.modules.root}
            >
                <div className={styles.grid}>
                    {categories.map((category) => (
                        <ModuleCategoryCard
                            key={category.id}
                            iconName={category.iconName}
                            color={category.color}
                            title={category.label}
                            description={category.description}
                            progressPercent={category.progressPercent}
                            modulesCount={category.modulesCount}
                            href={routes.apprenant.modules.filterByCategory(category.id)}
                        />
                    ))}
                </div>
            </CollapsibleSection>
        </Card>
    )
}
