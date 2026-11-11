import { notFound } from "next/navigation"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { computeApprenantDossier } from "@/lib/apprenantDossier"
import { routes } from "@/constants/routes"
import ApprenantDossierView from "@/components/shared/ApprenantDossierView"
import styles from "./page.module.css"

interface ApprenantDetailPageProps {
    params: Promise<{ apprenantId: string }>
}

/**
 * Page de détail d'un apprenant pour le formateur. Le résumé (ApprenantSummary,
 * groupe/retard/tendance) reste la source pour le contexte "dans quel
 * groupe", mais le vrai détail (progression par module, meilleur/pire
 * niveau, moments forts) vient maintenant de computeApprenantDossier
 * (lib/apprenantDossier.ts), partagé avec la page équivalente
 * gestionnaire — même calcul, jamais dupliqué.
 *
 * Un apprenant présent dans plusieurs groupes gérés par ce formateur
 * n'affiche pour l'instant que la première correspondance trouvée pour
 * le groupName affiché en sous-titre — l'agrégation multi-groupe reste à
 * faire (pas testable avec le mock actuel, un seul groupe géré par le
 * formateur de démo).
 */
export default async function FormateurApprenantDetailPage({ params }: ApprenantDetailPageProps) {
    const { apprenantId } = await params
    const { user, formateurProfile } = await getCurrentSession()
    const summaries = await getApprenantSummariesForFormateur(user.id)
    const summary = summaries.find((s) => s.userId === apprenantId)
    if (!summary) notFound()

    const [dossier, categories] = await Promise.all([
        computeApprenantDossier(apprenantId),
        getCategoriesForOrganization(formateurProfile?.organizationId ?? ""),
    ])

    return (
        <div className={styles.pageWrapper}>
            <ApprenantDossierView
                fullName={summary.fullName}
                avatarUrl={summary.avatarUrl}
                groupName={summary.groupName}
                breadcrumbItems={[
                    { label: "Mes groupes", href: routes.formateur.groupes.root },
                    { label: summary.groupName, href: routes.formateur.groupes.bySlug(summary.groupSlug) },
                ]}
                dossier={dossier}
                categories={categories}
                scoreTrend={summary.scoreTrend}
            />
        </div>
    )
}