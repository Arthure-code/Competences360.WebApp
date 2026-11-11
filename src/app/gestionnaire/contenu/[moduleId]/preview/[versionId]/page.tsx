import { notFound } from "next/navigation"
import { getModuleVersionById, getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import PreviewEditorView from "@/components/shared/PreviewEditorView"
import styles from "./page.module.css"

interface PreviewPageProps {
    params: Promise<{ moduleId: string; versionId: string }>
}

export default async function GestionnairePreviewPage({ params }: PreviewPageProps) {
    const { moduleId, versionId } = await params
    const [version, categories, allVersions] = await Promise.all([
        getModuleVersionById(versionId),
        getAllCategories(),
        getVersionsForModule(moduleId),
    ])
    if (!version) notFound()

    const ascending = [...allVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const versionNumber = ascending.findIndex((v) => v.id === versionId) + 1

    return (
        <div className={styles.pageWrapper}>
            <PreviewEditorView version={version} versionNumber={versionNumber} categories={categories} role="gestionnaire" />
        </div>
    )
}