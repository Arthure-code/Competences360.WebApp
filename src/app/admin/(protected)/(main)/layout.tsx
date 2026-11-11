import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { routes } from "@/constants/routes"
import AdminShell from "@/app/admin/_components/AdminShell"

export const dynamic = "force-dynamic"

export default async function AdminMainLayout({ children }: { children: React.ReactNode }) {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login) // filet de sécurité, (protected) l'a déjà garanti normalement

    if (!session.admin.hasChangedPassword) {
        redirect(routes.admin.premiereConnexion)
    }

    return <AdminShell admin={session.admin}>{children}</AdminShell>
}