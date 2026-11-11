import PageHeader from "@/components/ui/PageHeader"
import StatGrid from "@/components/ui/StatGrid"
import Button from "@/components/ui/Button"
import { getMyManagedGroups } from "@/_mocks/groups.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getPlatformConfiguration } from "@/_mocks/configuration.mock"
import { computeFormateurStats, getLateAlertEntries, getApprenantsNeedingAttention } from "@/lib/formateurDashboard"
import { computeGroupStatsRows } from "@/lib/groupStats"
import { routes } from "@/constants/routes"
import LateAlertsNotice from "@/components/shared/accueil/LateAlertsNotice"
import GroupsPreviewSection from "@/components/shared/accueil/GroupsPreviewSection"
import AttentionSection from "@/components/shared/accueil/AttentionSection"
import styles from "./page.module.css"

const GROUPS_PREVIEW_COUNT = 3

export default async function FormateurAccueilPage() {
    const { user } = await getCurrentSession()
    const [groups, summaries, configuration] = await Promise.all([
        getMyManagedGroups(user.id),
        getApprenantSummariesForFormateur(user.id),
        getPlatformConfiguration(),
    ])

    const stats = computeFormateurStats(groups, summaries)
    const lateAlertEntries = getLateAlertEntries(summaries)
    const apprenantsNeedingAttention = getApprenantsNeedingAttention(
        summaries, configuration.joursInactivite)

    const allGroupRows = await computeGroupStatsRows(groups, summaries)
    const groupPreviewRows = allGroupRows.slice(0, GROUPS_PREVIEW_COUNT)

    const statsItems = [
        { id: "groups", label: "Groupes gérés", value: stats.groupCount, icon: "faUserGroup" },
        { id: "apprenants", label: "Apprenants", value: stats.apprenantCount, icon: "faUser" },
        { id: "progress", label: "Progression moyenne", value: `${stats.averageProgressPercent}%`, icon: "faChartLine" },
    ]

    return (
        <div className={styles.page}>
            <PageHeader
                title={`Bonjour, ${user.preferredFirstName ?? user.firstName}`}
                subtitle="Voici un aperçu de vos groupes et de vos apprenants."
                actions={
                    <div className={styles.actionsRow}>
                        <Button label="Assigner un module" variant="outline" href={routes.formateur.assignations} />
                        <Button label="+ Créer un groupe" href={routes.formateur.groupes.create} />
                    </div>
                }
            />

            <StatGrid items={statsItems} columns={3} />

            <LateAlertsNotice entries={lateAlertEntries} role="formateur" />

            <GroupsPreviewSection rows={groupPreviewRows} totalGroupCount={groups.length} role="formateur" />

            <AttentionSection apprenants={apprenantsNeedingAttention} role="formateur" />
        </div>
    )
}