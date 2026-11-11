import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getModuleVersionById, getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { getAdminFullName } from "@/lib/adminUser"
import { routes } from "@/constants/routes"
import AdminEditorView from "@/app/admin/_components/contenu/AdminEditorView"

interface AdminContentEditorPageProps {
    params: Promise<{ moduleId: string; versionId: string }>
}

/**
 * Même patron que GestionnaireContentEditorPage — moduleId dans l'URL
 * sert à charger le ContentModule (savoir si CETTE version est
 * l'officielle) et calculer versionNumber, pas à charger la version
 * elle-même (version.moduleId suffit pour ça).
 */
export default async function AdminContentEditorPage({ params }: AdminContentEditorPageProps) {
    const { moduleId, versionId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const [version, module, categories] = await Promise.all([
        getModuleVersionById(versionId),
        getContentModuleById(moduleId),
        getAllCategories(),
    ])
    if (!version || !module) notFound()

    const allVersions = await getVersionsForModule(moduleId)
    const ascending = [...allVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const versionNumber = ascending.findIndex((v) => v.id === versionId) + 1

    return (
        <AdminEditorView
            version={version}
            isOfficial={module.officialVersionId === version.id}
            hasOfficialVersion={Boolean(module.officialVersionId)}
            versionNumber={versionNumber}
            categories={categories}
            adminId={session.admin.id}
            adminName={getAdminFullName(session.admin)}
        />
    )
}