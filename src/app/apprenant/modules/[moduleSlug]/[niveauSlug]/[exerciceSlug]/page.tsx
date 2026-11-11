import { notFound } from "next/navigation"
import { getAssignedModuleBySlug } from "@/lib/assignedModules"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import Breadcrumb from "@/components/ui/Breadcrumb"
import ExercisePlayer from "@/components/exercises/ExercisePlayer"
import { routes } from "@/constants/routes"
import styles from "./page.module.css"

interface ExercicePageProps {
    /** Next.js 15 : params est une Promise, doit être awaité avant lecture */
    params: Promise<{
        moduleSlug: string
        niveauSlug: string
        exerciceSlug: string
    }>
}

/**
 * ExercisePlayer contient déjà son propre ExerciseStepper en premier
 * élément (voir ExercisePlayer.tsx) — cette page n'a donc qu'à fournir le
 * fil d'Ariane au-dessus, pas un 2e stepper séparé. Purement structurel :
 * ExercisePlayer lit lui-même la progression via useNiveauProgress
 * (localStorage, par niveauId) — rien à hydrater côté client ici,
 * contrairement aux pages liste/détail/intro.
 */
export default async function ExercicePage({ params }: ExercicePageProps) {
    const { moduleSlug, niveauSlug, exerciceSlug } = await params
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

    const initialIndex = niveau.exercises.findIndex((exercise) => exercise.slug === exerciceSlug)
    if (initialIndex === -1) notFound()

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Breadcrumb
                    items={[
                        {
                            label: `Module : ${result.module.title}`,
                            href: routes.apprenant.modules.bySlug(result.module.slug),
                        },
                        { label: niveau.title },
                    ]}
                />
            </div>

            <div className={styles.content}>
                <ExercisePlayer
                    exercises={niveau.exercises}
                    moduleSlug={result.module.slug}
                    niveauSlug={niveau.slug}
                    initialIndex={initialIndex}
                />
            </div>
        </div>
    )
}