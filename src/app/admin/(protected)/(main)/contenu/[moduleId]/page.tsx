import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { routes } from "@/constants/routes"
import AdminModuleDetailView from "@/app/admin/_components/contenu/AdminModuleDetailView"

interface AdminModuleDetailPageProps {
    params: Promise<{ moduleId: string }>
}

/**
 * C'est ici que AdminEditorView redirige après « Publier »
 * (routes.admin.contenu.module) — version actuelle, brouillon en cours
 * s'il y en a un, historique avec Restaurer. Voir AdminModuleDetailView.
 */
export default async function AdminModuleDetailPage({ params }: AdminModuleDetailPageProps) {
    const { moduleId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const [module, versions] = await Promise.all([getContentModuleById(moduleId), getVersionsForModule(moduleId)])
    if (!module) notFound()

    return <AdminModuleDetailView module={module} versions={versions} adminId={session.admin.id} />
}