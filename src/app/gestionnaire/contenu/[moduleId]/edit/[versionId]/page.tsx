import { notFound } from "next/navigation"
import { getModuleVersionById, getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { isVersionAssignedByOthers } from "@/_mocks/assignments.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getCommentsForVersion } from "@/_mocks/reviewComments.mock"
import { getFullName } from "@/lib/user"
import EditorView from "@/components/shared/EditorView"
import styles from "./page.module.css"

interface ContentEditorPageProps {
    /** moduleId n'est pas utilisé directement pour charger la version (version.moduleId suffit) — présent dans l'URL pour éviter le conflit Next.js entre segments dynamiques frères, et utilisé ici pour charger le ContentModule (savoir si CETTE version est l'officielle) et calculer versionNumber. */
    params: Promise<{ moduleId: string; versionId: string }>
}

export default async function GestionnaireContentEditorPage({ params }: ContentEditorPageProps) {
    const { moduleId, versionId } = await params
    const [version, module, categories, { user, gestionnaireProfile }] = await Promise.all([
        getModuleVersionById(versionId),
        getContentModuleById(moduleId),
        getAllCategories(),
        getCurrentSession(),
    ])
    if (!version || !module) notFound()

    const isAssignedByOthers = await isVersionAssignedByOthers(versionId, user.id)
    const comments = await getCommentsForVersion(versionId)

    // v1 = la plus ancienne — même logique que ModulePageView, calculée ici pour l'afficher dans le topbar de l'éditeur.
    const allVersions = await getVersionsForModule(moduleId)
    const ascending = [...allVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const versionNumber = ascending.findIndex((v) => v.id === versionId) + 1

    // "Appliquer" ne dépend pas d'être propriétaire — voir EditorView (components/shared/contenu/EditorView.tsx).
    const canApplyOfficial = version.status === "published" && module.officialVersionId !== version.id

    return (
        <div className={styles.pageWrapper}>
            <EditorView
                version={version}
                isOfficial={module.officialVersionId === version.id}
                isAssignedByOthers={isAssignedByOthers}
                versionNumber={versionNumber}
                categories={categories}
                userId={user.id}
                organizationId={gestionnaireProfile?.organizationId ?? ""}
                role="gestionnaire"
                canApplyOfficial={canApplyOfficial}
                userFullName={getFullName(user)}
                comments={comments}
            />
        </div>
    )
}