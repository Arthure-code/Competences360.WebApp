import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations, getOrganizationByIdWithOverride } from "@/_mocksToMigrate/organizations.mock"
import { getOrganizationMembersWithOverrides } from "@/_mocksToMigrate/organizationMembers.mock"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getModuleCountForCategory } from "@/lib/categoryUsage"
import { getGroupsForOrganizationWithFallback } from "@/_mocksToMigrate/groups.mock"
import { getContentModules } from "@/_mocks/contentModules.mock"
import { routes } from "@/constants/routes"
import OrganisationDetailView from "@/app/admin/_components/organisations/OrganisationDetailView"

interface OrganisationDetailPageProps {
    params: Promise<{ organizationId: string }>
}

/**
 * getOrganizationByIdWithOverride enveloppe le VRAI getOrganizationById
 * (backend) — les données de base (nom, adresse, secteur, etc.) sont
 * réelles ; seul isActive est superposé localement (voir
 * _mocksToMigrate/organizations.mock.ts, temporaire).
 *
 * members/allOrganizations servent la section "Membres" (points 5/6 —
 * réassigner les rôles, corriger l'affiliation) — allOrganizations sert
 * de liste pour choisir la nouvelle org d'un membre mal assigné.
 *
 * categories/moduleCounts — réutilise CategoriesManager (components/shared/)
 * tel quel, exactement comme app/gestionnaire/organisation/page.tsx :
 * son propre commentaire anticipait déjà "l'endroit naturel où le futur
 * rôle Administrateur consultera une org précise".
 */
export default async function OrganisationDetailPage({ params }: OrganisationDetailPageProps) {
    const { organizationId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organization = await getOrganizationByIdWithOverride(organizationId)
    if (!organization) notFound()

    const [members, allOrganizations, categories, groups, contentModules] = await Promise.all([
        getOrganizationMembersWithOverrides(organizationId),
        getAllOrganizations(),
        getCategoriesForOrganization(organizationId),
        getGroupsForOrganizationWithFallback(organizationId),
        getContentModules(organizationId),
    ])

    const moduleCounts: Record<string, number> = {}
    await Promise.all(
        categories.map(async (category) => {
            moduleCounts[category.id] = await getModuleCountForCategory(category.id, organizationId)
        })
    )

    return (
        <OrganisationDetailView
            organization={organization}
            members={members}
            allOrganizations={allOrganizations}
            categories={categories}
            moduleCounts={moduleCounts}
            groups={groups}
            adminUserId={session.admin.id}
            contentModules={contentModules}
        />
    )
}