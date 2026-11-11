import { faUserGroup } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import { getGroupsForOrganization } from "@/_mocks/groups.mock"
import { getApprenantSummariesForOrganization } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { computeGroupStatsRows } from "@/lib/groupStats"
import { routes } from "@/constants/routes"
import StaffGroupListItem from "@/components/shared/groupes/StaffGroupListItem"
import styles from "./page.module.css"

/**
 * Vue org entière, tous les groupes, peu importe qui les gère,
 * contrairement à /formateur/groupes (scopé au formateur courant). Même
 * carte réutilisée (StaffGroupListItem), même calcul de progression moyenne
 * (voir lib/groupStats.ts, computeGroupStatsRows, réutilisée aussi par
 * Accueil et Statistiques).
 */
export default async function GestionnaireGroupesPage() {
    const { gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const [groups, summaries] = await Promise.all([
        getGroupsForOrganization(organizationId),
        getApprenantSummariesForOrganization(organizationId),
    ])

    const rows = await computeGroupStatsRows(groups, summaries)

    return (
        <div className={styles.page}>
            <PageHeader
                title="Groupes"
                subtitle={`${groups.length} groupe${groups.length > 1 ? "s" : ""} dans l'organisation`}
                actions={<Button label="+ Créer un groupe" href={routes.gestionnaire.groupes.create} />}
            />

            {groups.length === 0 ? (
                <EmptyState
                    icon={faUserGroup}
                    title="Aucun groupe dans l'organisation pour l'instant."
                    description="Créez le premier groupe pour commencer à assigner des modules."
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
                            role="gestionnaire"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}