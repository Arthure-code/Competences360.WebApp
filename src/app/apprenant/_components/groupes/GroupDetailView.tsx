import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import GroupHeaderSection from "./GroupHeaderSection"
import GroupModulesSection from "./GroupModulesSection"
import { getAssignedModulesForGroup } from "@/lib/assignedModules"
import { getGroupMemberCount } from "@/_mocks/groups.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { routes } from "@/constants/routes"
import type { Group } from "@/types/group"
import styles from "./GroupDetailView.module.css"

interface GroupDetailViewProps {
    group: Group
    /** Résolu par la page appelante (getOrganizationById), ce composant ne fait plus de fetch redondant */
    organizationName: string
    userId: string
    /** true uniquement quand on vient de la liste (plusieurs groupes) */
    showBackLink?: boolean
}

/**
 * Composant serveur async, Next.js le permet même hors d'un fichier
 * page.tsx. Ne reçoit plus `modules` en prop — group.moduleIds était un
 * reliquat de l'ancien système, la vraie source de vérité est
 * Assignment (voir getAssignedModulesForGroup, lib/assignedModules.ts).
 * La liste de modules elle-même est déléguée à GroupModulesSection
 * (client), qui hydrate la progression — voir son commentaire pour le
 * bug que ça corrige (statut toujours neutre, jamais "en retard").
 */
export default async function GroupDetailView({
    group,
    organizationName,
    userId,
    showBackLink = false,
}: GroupDetailViewProps) {
    const [groupModuleResults, memberCount, categories] = await Promise.all([
        getAssignedModulesForGroup(group.id),
        getGroupMemberCount(group.id),
        getAllCategories(),
    ])

    return (
        <div className={styles.wrapper}>
            {showBackLink && (
                <Link href={routes.apprenant.groupes.root} className={styles.backLink}>
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Retour aux groupes
                </Link>
            )}

            <GroupHeaderSection group={group} organizationName={organizationName} memberCount={memberCount} userId={userId} />

            <GroupModulesSection groupModuleResults={groupModuleResults} categories={categories} />
        </div>
    )
}