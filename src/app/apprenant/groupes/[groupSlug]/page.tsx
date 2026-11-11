import { notFound } from "next/navigation"
import { getGroupBySlug } from "@/_mocks/groups.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import GroupDetailView from "@/app/apprenant/_components/groupes/GroupDetailView"
import styles from "../page.module.css"

interface GroupDetailPageProps {
    /** La clé doit correspondre exactement au nom du dossier [groupSlug], pas juste "slug" — sinon toujours undefined, silencieusement, et la page semble "introuvable" sans jamais lever d'erreur */
    params: Promise<{ groupSlug: string }>
}

/** N'appelle plus getAllModules — GroupDetailView résout ses modules assignés lui-même (voir getAssignedModulesForGroup, lib/assignedModules.ts). */
export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { groupSlug } = await params
    const group = await getGroupBySlug(groupSlug)
    if (!group) notFound()

    const { user } = await getCurrentSession()
    const organization = await getOrganizationById(group.organizationId)

    return (
        <div className={styles.page}>
            <GroupDetailView
                group={group}
                organizationName={organization?.name ?? ""}
                userId={user.id}
                showBackLink
            />
        </div>
    )
}