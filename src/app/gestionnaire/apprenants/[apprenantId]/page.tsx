import { notFound } from "next/navigation"
import { getApprenantSummariesForOrganization } from "@/_mocks/apprenantSummaries.mock"
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
 * Page de détail d'un apprenant pour le gestionnaire.
 * Même vue partagée (ApprenantDossierView) et même calcul
 * (computeApprenantDossier, lib/apprenantDossier.ts) que côté formateur —
 * seule la source du résumé de contexte (groupe/retard/tendance) change.
 */
export default async function GestionnaireApprenantDetailPage({ params }: ApprenantDetailPageProps) {
    const { apprenantId } = await params
    const { gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const summaries = await getApprenantSummariesForOrganization(organizationId)
    const summary = summaries.find((s) => s.userId === apprenantId)
    if (!summary) notFound()

    const [dossier, categories] = await Promise.all([
        computeApprenantDossier(apprenantId),
        getCategoriesForOrganization(organizationId),
    ])

    return (
        <div className={styles.pageWrapper}>
            <ApprenantDossierView
                fullName={summary.fullName}
                avatarUrl={summary.avatarUrl}
                groupName={summary.groupName}
                breadcrumbItems={[
                    { label: "Membres", href: routes.gestionnaire.membres },
                    { label: summary.groupName, href: routes.gestionnaire.groupes.bySlug(summary.groupSlug) },
                ]}
                dossier={dossier}
                categories={categories}
                scoreTrend={summary.scoreTrend}
            />
        </div>
    )
}