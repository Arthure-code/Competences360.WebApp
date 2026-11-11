import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getModuleVersionById, getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { routes } from "@/constants/routes"
import AdminContentPreviewView from "@/app/admin/_components/contenu/AdminContentPreviewView"

interface AdminContentPreviewPageProps {
    params: Promise<{ moduleId: string; versionId: string }>
}

/**
 * Supervision (OrganisationContentSection.tsx) — aperçu strictement en
 * lecture, jamais d'édition ni de fork. ContentEditor avec readOnly:true
 * et readOnlyReason:"preview" — même patron que les routes preview réelles
 * (/formateur/contenu/.../preview/..., /gestionnaire/.../preview/...),
 * mais pour Admin, qui n'a aucun des deux rôles attendus par ces routes.
 */
export default async function AdminContentPreviewPage({ params }: AdminContentPreviewPageProps) {
    const { moduleId, versionId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const [version, categories] = await Promise.all([getModuleVersionById(versionId), getAllCategories()])
    if (!version) notFound()

    const allVersions = await getVersionsForModule(moduleId)
    const ascending = [...allVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const versionNumber = ascending.findIndex((v) => v.id === versionId) + 1

    return (
        <AdminContentPreviewView
            version={version}
            versionNumber={versionNumber}
            categories={categories}
            adminId={session.admin.id}
        />
    )
}