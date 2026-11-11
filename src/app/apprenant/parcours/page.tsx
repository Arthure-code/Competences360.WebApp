import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { getCategoriesForIds } from "@/_mocks/categories.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import ParcoursView from "@/app/apprenant/_components/parcours/ParcoursView"
import styles from "./page.module.css"

/** force-dynamic : même raison que /apprenant/modules — la progression dépend de localStorage. */
export const dynamic = "force-dynamic"

export default async function ParcoursPage() {
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)

    // assignedResults résolu avant categories — getCategoriesForIds a
    // besoin des categoryId des modules déjà assignés (voir
    // categories.mock.ts ; ApprenantProfile ne porte pas d'organizationId,
    // résoudre par id est plus robuste que de deviner "son" org).
    const assignedResults = await getAssignedModulesStructural(
        user.id,
        myGroups.map((g) => g.id)
    )
    const categories = await getCategoriesForIds(assignedResults.map((r) => r.module.categoryId))

    return (
        <div className={styles.pageWrapper}>
            <ParcoursView assignedResults={assignedResults} categories={categories} />
        </div>
    )
}