import { faUserGroup } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import { getMyManagedGroups } from "@/_mocks/groups.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { computeGroupStatsRows } from "@/lib/groupStats"
import { routes } from "@/constants/routes"
import StaffGroupListItem from "@/components/shared/groupes/StaffGroupListItem"
import styles from "./page.module.css"

export default async function FormateurGroupesPage() {
    const { user } = await getCurrentSession()
    const [groups, summaries] = await Promise.all([
        getMyManagedGroups(user.id),
        getApprenantSummariesForFormateur(user.id),
    ])

    const rows = await computeGroupStatsRows(groups, summaries)

    return (
        <div className={styles.page}>
            <PageHeader
                title="Mes groupes"
                subtitle={`${groups.length} groupe${groups.length > 1 ? "s" : ""} géré${groups.length > 1 ? "s" : ""}`}
                actions={<Button label="+ Créer un groupe" href={routes.formateur.groupes.create} />}
            />

            {groups.length === 0 ? (
                <EmptyState
                    icon={faUserGroup}
                    title="Vous ne gérez aucun groupe pour l'instant."
                    description="Créez votre premier groupe pour commencer à assigner des modules."
                />
            ) : (
                <div className={styles.list}>
                    {rows.map(({ group, memberCount, pendingInvitationCount, averageProgress, lateCount }) => (
                        <StaffGroupListItem
                            key={group.id}
                            group={group}
                            memberCount={memberCount}
                            pendingInvitationCount={pendingInvitationCount}
                            averageProgress={averageProgress}
                            lateCount={lateCount}
                            role="formateur"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}