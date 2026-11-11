import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getGroupMemberCount } from "@/_mocks/groups.mock"
import { getGroupBySlugWithFallback } from "@/_mocksToMigrate/groups.mock"
import { getAssignedModulesForGroup } from "@/lib/assignedModules"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getOrganizationByIdWithOverride } from "@/_mocksToMigrate/organizations.mock"
import { routes } from "@/constants/routes"
import AdminGroupDetailView from "@/app/admin/_components/groupes/AdminGroupDetailView"

interface AdminGroupDetailPageProps {
    params: Promise<{ groupSlug: string }>
}

/**
 * getGroupBySlug (vrai, _mocks/groups.mock.ts) ne prend qu'un slug, pas
 * d'org/userId — contrairement à GroupDetailView (apprenant), rien ici
 * ne dépend d'une session scopée à une seule org, cohérent avec un accès
 * Admin cross-org.
 *
 * Groupe de REPLI (id "fallback-grp-X", voir groupsFallback.seed.ts) —
 * jamais reconnu par le vrai backend, qui exige un id numérique.
 * getGroupMemberCount/getAssignedModulesForGroup, appelés avec cet id,
 * échouent avec une erreur de VALIDATION (400) — contrairement à une
 * panne réseau, apiTolerant ne l'avale pas, ça fait planter la page.
 * Pour un groupe de repli, on saute carrément ces appels (0 membre,
 * aucun module assigné) plutôt que de les tenter en sachant qu'ils vont
 * échouer.
 */
export default async function AdminGroupDetailPage({ params }: AdminGroupDetailPageProps) {
    const { groupSlug } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const group = await getGroupBySlugWithFallback(groupSlug)
    if (!group) notFound()

    const isFallbackGroup = group.id.startsWith("fallback-")

    const [memberCount, groupModuleResults, organization] = await Promise.all([
        isFallbackGroup ? Promise.resolve(0) : getGroupMemberCount(group.id),
        isFallbackGroup ? Promise.resolve([]) : getAssignedModulesForGroup(group.id),
        getOrganizationByIdWithOverride(group.organizationId),
    ])
    const categories = await getCategoriesForOrganization(group.organizationId)

    return (
        <AdminGroupDetailView
            group={group}
            organizationName={organization?.name ?? "Organisation"}
            memberCount={memberCount}
            groupModuleResults={groupModuleResults}
            categories={categories}
        />
    )
}