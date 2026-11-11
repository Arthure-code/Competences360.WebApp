import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations } from "@/_mocks/organizations.mock"
import { routes } from "@/constants/routes"
import OrganisationsListView from "@/app/admin/_components/organisations/OrganisationsListView"

export default async function OrganisationsListPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organizations = await getAllOrganizations()

    return <OrganisationsListView organizations={organizations} />
}