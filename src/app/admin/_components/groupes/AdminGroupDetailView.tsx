import GroupHeaderCard from "@/components/groupes/GroupHeaderCard"
import ModuleCard from "@/components/shared/ModuleCard"
import PageSubheader from "@/components/ui/PageSubheader"
import type { Group } from "@/types/group"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Category } from "@/types/category"
import styles from "./AdminGroupDetailView.module.css"

interface AdminGroupDetailViewProps {
    group: Group
    organizationName: string
    memberCount: number
    groupModuleResults: AssignedModuleResult[]
    categories: Category[]
}

/**
 * GroupHeaderCard (components/groupes/) réutilisé tel quel, directement
 * — pas de wrapper GroupHeaderSection (propre à l'apprenant, gère
 * "Quitter le groupe", qui n'a aucun sens pour Admin) : onLeaveGroup
 * n'est simplement jamais fourni, le bouton ne s'affiche pas (déjà géré
 * par le composant lui-même, aucune modification nécessaire).
 *
 * Modules affichés SANS hydratation client (pas de useHydratedModules,
 * contrairement à GroupModulesSection apprenant) — hydrater lirait le
 * localStorage du navigateur D'ADMIN, pas celui des vrais membres du
 * groupe, ce qui afficherait une progression complètement fausse. La
 * vraie progression moyenne du groupe est déjà visible sur
 * GroupHeaderCard (group.averageProgressPercent) — honnête de ne pas en
 * ajouter une fausse ici en plus.
 */
export default function AdminGroupDetailView({
    group,
    organizationName,
    memberCount,
    groupModuleResults,
    categories,
}: AdminGroupDetailViewProps) {
    return (
        <div className={styles.wrapper}>
            <GroupHeaderCard group={group} organizationName={organizationName} memberCount={memberCount} />

            <div className={styles.modulesSection}>
                <PageSubheader
                    title="Modules assignés par ce groupe"
                    meta={`${groupModuleResults.length} module${groupModuleResults.length > 1 ? "s" : ""} au total`}
                />
                <div className={styles.moduleList}>
                    {groupModuleResults.map(({ module }) => (
                        <ModuleCard key={module.id} module={module} category={categories.find((c) => c.id === module.categoryId)} />
                    ))}
                </div>
            </div>
        </div>
    )
}
