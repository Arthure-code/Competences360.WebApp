import { notFound } from "next/navigation"
import { getAssignedModuleBySlug } from "@/lib/assignedModules"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import BilanView from "@/app/apprenant/_components/bilan/BilanView"
import styles from "./page.module.css"

/** force-dynamic : voir app/apprenant/modules/page.tsx pour la raison. */
export const dynamic = "force-dynamic"

interface BilanPageProps {
    /** Next.js 15 : params est une Promise, doit être awaité avant lecture */
    params: Promise<{ moduleSlug: string; niveauSlug: string }>
}

/**
 * Server Component : résout le module assigné + l'activité, sécurité
 * (notFound si pas assigné). Le score réel (currentScore, nécessaire pour
 * construire le badge de fin d'activité) dépend de localStorage —
 * inaccessible ici, BilanView (client) le recalcule au montage.
 */
export default async function BilanPage({ params }: BilanPageProps) {
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
        <div className={styles.page}>
            <BilanView module={result.module} niveauId={niveau.id} dueDate={result.dueDate} />
        </div>
    )
}