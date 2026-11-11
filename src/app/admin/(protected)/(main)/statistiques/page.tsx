import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations } from "@/_mocksToMigrate/organizations.mock"
import { getGroupsForOrganization } from "@/_mocks/groups.mock"
import { getApprenantSummariesForOrganization } from "@/_mocks/apprenantSummaries.mock"
import { getContentModules } from "@/_mocks/contentModules.mock"
import { getModuleUserIdsForApprenants } from "@/_mocks/apprenantModuleProgress.mock"
import { computeGroupStatsRows } from "@/lib/groupStats"
import { computeOrganizationStatsRows } from "@/lib/organizationStats"
import { routes } from "@/constants/routes"
import AdminStatistiquesView from "@/app/admin/_components/statistiques/AdminStatistiquesView"

/**
 * Vue combinée — contrairement à Gestionnaire (scopé à SA seule org),
 * Admin a besoin de voir la santé de TOUTE la plateforme. Un appel par
 * org, fusionné — correct à l'échelle actuelle (quelques orgs), pas une
 * vraie route d'agrégation dédiée. Noté dans le doc backend.
 *
 * Même structure de filtres que StatistiquesView (le vrai, gestionnaire)
 * — Groupe/Formateur/Module — mais calculés à travers TOUTES les orgs
 * plutôt qu'une seule. Le filtre Module a besoin de modules ET de
 * apprenantModuleUserIds par org, récupérés ici de la même façon.
 */
export default async function AdminStatistiquesPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organizations = await getAllOrganizations()

    const perOrgData = await Promise.all(
        organizations.map(async (org) => {
            const [groups, summaries, modules] = await Promise.all([
                getGroupsForOrganization(org.id),
                getApprenantSummariesForOrganization(org.id),
                getContentModules(org.id),
            ])
            const groupRows = await computeGroupStatsRows(groups, summaries)
            const apprenantModuleUserIds = await getModuleUserIdsForApprenants(summaries.map((s) => s.userId))
            return { organization: org, groupRows, summaries, modules, apprenantModuleUserIds }
        })
    )

    // Union des groupRows/summaries par org, pour computeOrganizationStatsRows (lib/organizationStats.ts, nouveau).
    const groupRowsByOrg = new Map(perOrgData.map((d) => [d.organization.id, d.groupRows]))
    const summariesByOrg = new Map(perOrgData.map((d) => [d.organization.id, d.summaries]))
    const organizationStatsRows = computeOrganizationStatsRows(organizations, groupRowsByOrg, summariesByOrg)

    return (
        <AdminStatistiquesView
            organizations={organizations}
            perOrgData={perOrgData}
            organizationStatsRows={organizationStatsRows}
        />
    )
}