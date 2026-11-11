import { notFound } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import Breadcrumb from "@/components/ui/Breadcrumb"
import GroupJoinCodeBadge from "@/components/shared/groupes/GroupJoinCodeBadge"
import AddApprenantsTable from "@/app/formateur/_components/groupes/AddApprenantsTable"
import GroupInvitationsSection from "@/app/formateur/_components/groupes/GroupInvitationsSection"
import EditableGroupName from "@/app/formateur/_components/groupes/EditableGroupName"
import GroupApprenantsAssignationsSection from "@/components/shared/groupes/GroupApprenantsAssignationsSection"
import { getGroupBySlug, getGroupMemberCount, getGroupQrCode } from "@/_mocks/groups.mock"
import { getInvitationsForGroup } from "@/_mocks/invitations.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getGroupAssignationsSummary } from "@/lib/groupAssignationsSummary"
import { routes } from "@/constants/routes"
import styles from "./page.module.css"

interface FormateurGroupDetailPageProps {
    params: Promise<{ groupSlug: string }>
}

/**
 * Épopée 16 — les apprenants ET les assignations du groupe vivent
 * maintenant ensemble ici (GroupApprenantsAssignationsSection, tabs ou
 * côte à côte selon la largeur) — auparavant, voir les modules assignés
 * à ce groupe demandait d'aller les chercher dans Assignations et de
 * filtrer soi-même.
 */
export default async function FormateurGroupDetailPage({ params }: FormateurGroupDetailPageProps) {
    const { groupSlug } = await params
    const group = await getGroupBySlug(groupSlug)
    if (!group) notFound()

    const { user, formateurProfile } = await getCurrentSession()
    const [memberCount, allSummaries, groupInvitations, assignations, qrCodeUrl] = await Promise.all([
        getGroupMemberCount(group.id),
        getApprenantSummariesForFormateur(user.id),
        getInvitationsForGroup(group.id),
        getGroupAssignationsSummary(group.id),
        getGroupQrCode(group.id),
    ])
    const roster = allSummaries.filter((summary) => summary.groupId === group.id)

    return (
        <div className={styles.page}>
            <Breadcrumb items={[{ label: "Mes groupes", href: routes.formateur.groupes.root }, { label: group.name }]} />

            <PageHeader title={group.name} subtitle={`${memberCount} apprenant${memberCount > 1 ? "s" : ""}`} />

            <EditableGroupName groupId={group.id} name={group.name} />

            <GroupJoinCodeBadge joinCode={group.joinCode} qrCodeUrl={qrCodeUrl} />

            <AddApprenantsTable
                groupId={group.id}
                organizationId={group.organizationId ?? formateurProfile?.organizationId ?? ""}
                invitedByUserId={user.id}
            />

            <GroupInvitationsSection invitations={groupInvitations} />

            <GroupApprenantsAssignationsSection roster={roster} role="formateur" assignations={assignations} />
        </div>
    )
}