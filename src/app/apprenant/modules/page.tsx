import { Suspense } from "react"
import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { getAllCategories } from "@/_mocks/categories.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import ModulesView from "@/app/apprenant/_components/modules/ModulesView"
import styles from "./page.module.css"

/**
 * force-dynamic : la progression affichée dépend de localStorage, jamais
 * fiable à figer dans le cache de route de Next.js — sans ça, revenir sur
 * cette page après avoir répondu à un exercice peut réutiliser un rendu
 * précédent (avant la réponse), plutôt que de repasser vraiment par le
 * serveur puis réhydrater côté client.
 */
export const dynamic = "force-dynamic"

/**
 * Server Component : récupère modules + catégories (async), les passe à
 * ModulesView (client) — useSearchParams a besoin du navigateur, ce
 * composant-ci ne peut donc pas awaiter lui-même. Même pattern que
 * Mon parcours (page.tsx + ParcoursView).
 *
 * <Suspense> est requis ici — pas cosmétique : useSearchParams() sans
 * frontière Suspense fait échouer `next build` (prerender-error), même si
 * `next dev` ne s'en plaint pas. Next.js a besoin de savoir jusqu'où
 * s'arrêter le rendu statique avant le contenu qui dépend du navigateur.
 *
 * Les modules retournés par getAssignedModulesStructural ont des champs
 * de progression neutres (status/progressPercent/currentScore) —
 * localStorage n'est pas accessible ici. ModulesView (client) les
 * recalcule au montage via hydrateModuleProgress (lib/moduleProgress.ts),
 * qui a besoin de dueDate — transmise à part du Module lui-même.
 */
export default async function ModulesPage() {
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)
    const [assignedResults, categories] = await Promise.all([
        getAssignedModulesStructural(
            user.id,
            myGroups.map((group) => group.id)
        ),
        getAllCategories(),
    ])

    return (
        <Suspense fallback={null}>
            <div className={styles.pageWrapper}>
                <ModulesView assignedResults={assignedResults} categories={categories} />
            </div>
        </Suspense>
    )
}