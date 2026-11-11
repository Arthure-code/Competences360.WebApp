import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { routes } from "@/constants/routes"
import AdminLoginForm from "@/app/admin/_components/login/AdminLoginForm"

export const dynamic = "force-dynamic"

/** Déjà connecté ? Direct vers /admin, pas de raison de revoir le formulaire. */
export default async function AdminLoginPage() {
    const session = await getCurrentAdminSession()
    if (session) redirect(routes.admin.home)

    return <AdminLoginForm />
}