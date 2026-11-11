import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { routes } from "@/constants/routes"
import ParametresView from "@/app/admin/_components/parametres/ParametresView"

export default async function ParametresPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    return <ParametresView />
}