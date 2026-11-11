import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getMyAdminDraftVersions, getBaseContentModules, getBaseContentTrash } from "@/_mocksAdmin/adminContent.actions"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { routes } from "@/constants/routes"
import AdminContenuView, { type ModuleCardData } from "@/app/admin/_components/contenu/AdminContenuView"

/**
 * Confirmé par le backend — plus de boucle sur toutes les organisations :
 * getBaseContentModules/getBaseContentTrash font chacun UN SEUL appel
 * (/api/contentmodules/base, /api/contentmodules/base/corbeille).
 * getMyAdminDraftVersions utilise maintenant la vraie URL confirmée
 * (/api/contentmodules/versions/mine/drafts).
 */
export default async function AdminContenuPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const [baseModules, drafts, trashedBaseModules] = await Promise.all([
        getBaseContentModules(),
        getMyAdminDraftVersions(session.admin.id),
        getBaseContentTrash(),
    ])

    const draftCards: ModuleCardData[] = (
        await Promise.all(
            drafts.map(async (version) => {
                const module = await getContentModuleById(version.moduleId)
               if (!module || module.trashedAt) return null
                return { module, displayVersion: version }
            })
        )
    ).filter((card): card is ModuleCardData => card !== null)

    return (
        <AdminContenuView
            baseModules={baseModules}
            draftCards={draftCards}
            trashedModules={trashedBaseModules}
            admin={session.admin}
        />
    )
}