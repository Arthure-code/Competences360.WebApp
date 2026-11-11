import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { routes } from "@/constants/routes"

export const dynamic = "force-dynamic"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    return <>{children}</>
}