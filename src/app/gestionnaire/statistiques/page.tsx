import { getGroupsForOrganization } from "@/_mocks/groups.mock"
import { getApprenantSummariesForOrganization } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getContentModules } from "@/_mocks/contentModules.mock"
import { getModuleUserIdsForApprenants } from "@/_mocks/apprenantModuleProgress.mock"
import { computeGroupStatsRows } from "@/lib/groupStats"
import StatistiquesView from "@/components/shared/statistiques/StatistiquesView"
import styles from "./page.module.css"

/**
 * Comparaison entre groupes et entre apprenants, filtres Groupe/Formateur
 * (org entière, contrairement à /formateur/statistiques scopé aux
 * groupes gérés) + export Excel/CSV/PDF, voir StatistiquesView.tsx.
 *
 * Filtre Module ajouté — débloqué par apprenantModuleProgress
 * (épopée 2), qui relie enfin un apprenant à un module précis de façon
 * fiable. "Performance par module/exercice" et le filtre Période restent
 * de côté, aucune vraie donnée derrière pour l'instant.
 */
export default async function GestionnaireStatistiquesPage() {
    const { gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const [groups, summaries, modules] = await Promise.all([
        getGroupsForOrganization(organizationId),
        getApprenantSummariesForOrganization(organizationId),
        getContentModules(organizationId),
    ])

    const allGroupRows = await computeGroupStatsRows(groups, summaries)

    const formateurOptions = Array.from(
        new Map(groups.map((group) => [group.contact.id, { id: group.contact.id, fullName: group.contact.fullName }])).values()
    )

    const moduleOptions = modules.map((module) => ({ id: module.id, title: module.title }))
    const apprenantModuleUserIds = await getModuleUserIdsForApprenants(summaries.map((s) => s.userId))

    return (
        <div className={styles.page}>
            <StatistiquesView
                allGroupRows={allGroupRows}
                allSummaries={summaries}
                formateurOptions={formateurOptions}
                moduleOptions={moduleOptions}
                apprenantModuleUserIds={apprenantModuleUserIds}
                role="gestionnaire"
            />
        </div>
    )
}