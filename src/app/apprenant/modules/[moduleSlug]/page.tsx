import { notFound } from "next/navigation"
import { getAssignedModuleBySlug } from "@/lib/assignedModules"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import ModuleDetailView from "@/app/apprenant/_components/modules/ModuleDetailView"
import styles from "./page.module.css"

/** force-dynamic : voir app/apprenant/modules/page.tsx pour la raison — la progression dépend de localStorage, jamais fiable à figer dans le cache de route. */
export const dynamic = "force-dynamic"

interface ModulePageProps {
    params: Promise<{ moduleSlug: string }>
}

/**
 * Server Component : résout le module assigné par slug. undefined si ce
 * module n'existe pas OU n'est pas assigné à cet apprenant (direct ou via
 * un groupe) — les deux cas rendent notFound(), pour ne jamais révéler
 * qu'un module existe à quelqu'un qui n'a pas le droit de le voir. Les
 * champs de progression retournés sont neutres (localStorage inaccessible
 * ici) — ModuleDetailView (client) les recalcule au montage.
 */
export default async function ModulePage({ params }: ModulePageProps) {
    const { moduleSlug } = await params
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)

    const result = await getAssignedModuleBySlug(
        moduleSlug,
        user.id,
        myGroups.map((group) => group.id)
    )
    if (!result) notFound()

    return (
        <div className={styles.pageWrapper}>
            <ModuleDetailView module={result.module} dueDate={result.dueDate} />
        </div>
    )
}