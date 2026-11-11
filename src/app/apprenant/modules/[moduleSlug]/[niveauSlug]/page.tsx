import { notFound } from "next/navigation"
import { getAssignedModuleBySlug } from "@/lib/assignedModules"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import NiveauIntroView from "@/app/apprenant/_components/modules/NiveauIntroView"
import styles from "./page.module.css"

/** force-dynamic : voir app/apprenant/modules/page.tsx pour la raison. */
export const dynamic = "force-dynamic"

interface NiveauPageProps {
    params: Promise<{ moduleSlug: string; niveauSlug: string }>
}

/**
 * Server Component : résout le module assigné, puis l'activité (niveau)
 * précise par son slug — notFound() si l'un ou l'autre n'existe pas ou
 * n'est pas assigné à cet apprenant. Progression neutre ici (localStorage
 * inaccessible côté serveur) — NiveauIntroView (client) la recalcule au
 * montage.
 */
export default async function NiveauIntroPage({ params }: NiveauPageProps) {
    const { moduleSlug, niveauSlug } = await params
    const { user } = await getCurrentSession()
    const myGroups = await getMyGroups(user.id)

    const result = await getAssignedModuleBySlug(
        moduleSlug,
        user.id,
        myGroups.map((group) => group.id)
    )
    if (!result) notFound()

    const niveau = result.module.niveaux.find((n) => n.slug === niveauSlug)
    if (!niveau) notFound()

    return (
        <div className={styles.pageWrapper}>
            <NiveauIntroView module={result.module} niveauId={niveau.id} dueDate={result.dueDate} />
        </div>
    )
}