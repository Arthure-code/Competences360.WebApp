import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { getUpcomingDeadlinesForApprenant } from "@/lib/apprenantDashboard"
import { getCategoriesForApprenant } from "@/_mocks/categories.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getAllProgressForApprenant } from "@/_mocks/apprenantModuleProgress.mock"
import { getDisplayFirstName } from "@/lib/user"
import DashboardView from "@/app/apprenant/_components/accueil/DashboardView"
import styles from "./page.module.css"

/**
 * force-dynamic : même raison que /apprenant/modules — la progression
 * affichée dépend de localStorage, jamais fiable à figer dans le cache de
 * route de Next.js.
 *
 * Remplace l'ancien Accueil (getDashboardData, dashboard.mock.ts,
 * entièrement déconnecté des vraies assignations) — "Reprendre ici" et
 * "Modules assignés" venaient d'un mock jamais relié à Assignment, d'où
 * les bugs. Server Component : récupère modules assignés + échéances
 * réelles + catégories, passe tout à DashboardView (client), qui hydrate
 * la progression au montage (voir DashboardView.tsx).
 *
 * progressEntries (apprenantModuleProgress) transmis à findResumeTarget —
 * "Reprendre ici" pouvait choisir le mauvais module s'il y en avait
 * plusieurs en cours, faute d'un vrai horodatage de dernière activité
 * (voir lib/apprenantDashboard.ts).
 */
export const dynamic = "force-dynamic"

export default async function AccueilApprenantPage() {
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)
    const groupIds = myGroups.map((g) => g.id)

    // assignedResults doit être résolu AVANT categories — la fonction
    // combinée (globales + org-scopées effectivement utilisées, voir
    // getCategoriesForApprenant) a besoin des categoryId des modules déjà
    // assignés, pas possible en parallèle avec un seul Promise.all.
    const [assignedResults, deadlines, progressEntries] = await Promise.all([
        getAssignedModulesStructural(user.id, groupIds),
        getUpcomingDeadlinesForApprenant(user.id, groupIds),
        getAllProgressForApprenant(user.id),
    ])
    const categories = await getCategoriesForApprenant(assignedResults.map((r) => r.module.categoryId))

    return (
        <div className={styles.pageWrapper}>
            <DashboardView
                firstName={getDisplayFirstName(user)}
                assignedResults={assignedResults}
                deadlines={deadlines}
                categories={categories}
                progressEntries={progressEntries}
            />
        </div>
    )
}