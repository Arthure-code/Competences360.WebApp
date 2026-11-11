import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations } from "@/_mocks/organizations.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { routes } from "@/constants/routes"
import AdminAccueilView from "@/app/admin/_components/accueil/AdminAccueilView"

/**
 * Première version — construite avec ce qui est déjà disponible
 * (organisations + membres). Ne couvre PAS encore la stagnation de
 * groupes/apprenants (comme côté gestionnaire, getStagnantGroups/
 * getApprenantsNeedingAttention) — ces fichiers n'ont pas été fournis
 * dans cette session, à enrichir plus tard si besoin.
 */
export default async function AdminAccueilPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organizations = await getAllOrganizations()

    // Un appel par organisation : à revoir si leur nombre grandit.
    const membersByOrg = await Promise.all(
        organizations.map(async (org) => ({ org, members: await getOrganizationMembers(org.id) }))
    )

    return <AdminAccueilView admin={session.admin} membersByOrg={membersByOrg} />
}