import { getMyManagedGroups } from "@/_mocks/groups.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getContentModules } from "@/_mocks/contentModules.mock"
import { getModuleUserIdsForApprenants } from "@/_mocks/apprenantModuleProgress.mock"
import { computeGroupStatsRows } from "@/lib/groupStats"
import StatistiquesView from "@/components/shared/statistiques/StatistiquesView"
import styles from "./page.module.css"

/**
 * Scopé à ses propres groupes gérés, contrairement à la vue org entière
 * du gestionnaire. Pas de formateurOptions ici, comparer par formateur
 * n'a de sens que pour le gestionnaire (voir StatistiquesView.tsx).
 *
 * Filtre Module ajouté, même source que côté gestionnaire
 * (apprenantModuleProgress) — organizationId nécessaire ici seulement
 * pour lister les modules de l'org (getContentModules), pas pour scoper
 * les groupes/apprenants, qui restent limités à ceux gérés par CE
 * formateur.
 */
export default async function FormateurStatistiquesPage() {
    const { user, formateurProfile } = await getCurrentSession()
    const organizationId = formateurProfile?.organizationId ?? ""

    const [groups, summaries, modules] = await Promise.all([
        getMyManagedGroups(user.id),
        getApprenantSummariesForFormateur(user.id),
        getContentModules(organizationId),
    ])

    const allGroupRows = await computeGroupStatsRows(groups, summaries)

    const moduleOptions = modules.map((module) => ({ id: module.id, title: module.title }))
    const apprenantModuleUserIds = await getModuleUserIdsForApprenants(summaries.map((s) => s.userId))

    return (
        <div className={styles.page}>
            <StatistiquesView
                allGroupRows={allGroupRows}
                allSummaries={summaries}
                moduleOptions={moduleOptions}
                apprenantModuleUserIds={apprenantModuleUserIds}
                role="formateur"
            />
        </div>
    )
}