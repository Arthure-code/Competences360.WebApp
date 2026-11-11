import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { getCategoriesForIds } from "@/_mocks/categories.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getMyRewards } from "@/_mocks/rewards.mock"
import ReussitesView from "@/app/apprenant/_components/reussites/ReussitesView"
import styles from "./page.module.css"

/**
 * force-dynamic : une recompense est attribuee au moment ou l'apprenant
 * termine une activite. Une page figee montrerait l'etat d'avant son dernier
 * exercice.
 */
export const dynamic = "force-dynamic"

export default async function ReussitesPage() {
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)

    // Les modules ne servent qu'a resoudre les libelles : une recompense
    // designe son activite et son module par identifiant, jamais par titre.
    const [assignedResults, rewards] = await Promise.all([
        getAssignedModulesStructural(
            user.id,
            myGroups.map((g) => g.id)
        ),
        getMyRewards(),
    ])

    // categories resolu apres assignedResults : getCategoriesForIds a besoin
    // des categoryId des modules assignes (voir categories.mock.ts).
    const categories = await getCategoriesForIds(assignedResults.map((r) => r.module.categoryId))

    return (
        <div className={styles.pageWrapper}>
            <ReussitesView
                assignedResults={assignedResults}
                categories={categories}
                rewards={rewards}
            />
        </div>
    )
}