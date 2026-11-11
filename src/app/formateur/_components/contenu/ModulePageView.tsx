"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import Button from "@/components/ui/Button"
import CreateVersionModal from "@/app/formateur/_components/contenu/CreateVersionModal"
import ModuleSummaryTab from "@/app/formateur/_components/contenu/ModuleSummaryTab"
import VersionHistoryTab from "@/app/formateur/_components/contenu/VersionHistoryTab"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import { getPreviewVersion, getAttributionLabel } from "@/lib/contentSharing"
import { createNewVersionInModule } from "@/_mocks/moduleVersions.actions"
import { applyOfficialVersion } from "@/_mocks/contentModules.actions"
import { routes } from "@/constants/routes"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { Category } from "@/types/category"
import styles from "./ModulePageView.module.css"

interface ModulePageViewProps {
    module: ContentModule
    versions: ModuleVersion[]
    organizationName: string
    categories: Category[]
    userId: string
    userFullName: string
    /** Réservé au gestionnaire, false par défaut (formateur n'a pas ce droit) */
    canApply?: boolean
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu pour les liens Modifier/Aperçu, sinon un gestionnaire atterrissait sur les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
}

type TabId = "summary" | "history"

export default function ModulePageView({
    module: initialModule,
    versions: initialVersions,
    organizationName,
    categories,
    userId,
    userFullName,
    canApply = false,
    role,
}: ModulePageViewProps) {
    const router = useRouter()
    const { maxVersionsParModule } = usePlatformConfiguration()
    const [module, setModule] = useState(initialModule)
    const [versions, setVersions] = useState(initialVersions)
    const [activeTab, setActiveTab] = useState<TabId>("summary")
    const [isCreateModalOpen, setCreateModalOpen] = useState(false)

    // v1 = la plus ancienne, peu importe l'ordre d'affichage utilisé ailleurs.
    const versionNumbers = useMemo(() => {
        const ascending = [...versions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        const map = new Map<string, number>()
        ascending.forEach((version, index) => map.set(version.id, index + 1))
        return map
    }, [versions])

    const previewVersion = getPreviewVersion(module, versions)
    const hasOfficial = module.officialVersionId !== null

    async function handleCreateVersion(sourceVersionId: string, note: string) {
        const newVersion = await createNewVersionInModule({
            moduleId: module.id,
            sourceVersionId,
            organizationId: module.organizationId,
            createdByUserId: userId,
            createdByName: userFullName,
            changeNote: note.trim() || undefined,
        })
        setCreateModalOpen(false)
        if (newVersion) router.push(routes.formateur.contenu.edit(newVersion.moduleId, newVersion.id))
    }

    async function handleApplyVersion(versionId: string) {
        await applyOfficialVersion(module.id, versionId, userId)
        setModule((prev) => ({ ...prev, officialVersionId: versionId }))
    }

    const tabs = [
        { id: "summary", label: "Résumé du contenu" },
        { id: "history", label: `Historique des versions (${versions.length})` },
    ] as const

    return (
        <div className={styles.page}>
            <Link href={routes.formateur.contenu.root} className={styles.backLink}>
                <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                Retour au contenu
            </Link>

            <PageHeader
                title={previewVersion?.content.title || "Module sans titre"}
                subtitle={previewVersion?.content.description}
                actions={
                    <Button
                        label="Créer une nouvelle version"
                        onClick={() => setCreateModalOpen(true)}
                        disabled={versions.length === 0}
                    />
                }
            />

            <div className={styles.statusRow}>
                {hasOfficial && previewVersion ? (
                    <span className={styles.appliedInfo}>
                        {getAttributionLabel(previewVersion, module, organizationName)}
                    </span>
                ) : (
                    <span className={styles.noOfficialBadge}>
                        Aucune version encore appliquée — les apprenants ne le verront pas tant qu'elle ne l'est pas
                    </span>
                )}
                <span className={styles.versionCount}>
                    {versions.length}/{maxVersionsParModule} versions
                </span>
            </div>

            <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

            {activeTab === "summary" && previewVersion && (
                <ModuleSummaryTab version={previewVersion} categories={categories} />
            )}

            {activeTab === "history" && (
                <VersionHistoryTab
                    module={module}
                    versions={versions}
                    versionNumbers={versionNumbers}
                    userId={userId}
                    canApply={canApply}
                    role={role}
                    onApply={handleApplyVersion}
                    onVersionsChanged={setVersions}
                />
            )}

            <CreateVersionModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                versions={versions}
                versionNumbers={versionNumbers}
                currentVersionCount={versions.length}
                onCreate={handleCreateVersion}
            />
        </div>
    )
}