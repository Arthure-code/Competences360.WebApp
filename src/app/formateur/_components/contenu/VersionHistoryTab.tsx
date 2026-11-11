"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import VersionHistoryRow from "./VersionHistoryRow"
import { summarizeContentDiff } from "@/lib/versionDiff"
import { deleteModuleVersion, deleteModuleVersions } from "@/_mocks/moduleVersions.actions"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { ContentModule } from "@/types/contentModule"
import styles from "./VersionHistoryTab.module.css"

interface VersionHistoryTabProps {
    module: ContentModule
    versions: ModuleVersion[]
    versionNumbers: Map<string, number>
    userId: string
    /** Réservé au gestionnaire, false côté formateur (voir ModulePageView) */
    canApply: boolean
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu pour les liens Modifier/Aperçu */
    role: "formateur" | "gestionnaire"
    onApply: (versionId: string) => Promise<void>
    onVersionsChanged: (versions: ModuleVersion[]) => void
}

/**
 * Sélection groupée façon Gmail, mais case à cocher seulement en mode
 * sélection (bouton "Sélectionner" pour l'activer), pas visible en
 * permanence. Barre d'action contextuelle qui remplace le bouton
 * "Sélectionner" dès qu'au moins 1 item est coché. Contrairement à Gmail
 * (Corbeille récupérable), notre suppression est définitive, confirmation
 * systématique avant d'exécuter.
 */
export default function VersionHistoryTab({
    module,
    versions,
    versionNumbers,
    userId,
    canApply,
    role,
    onApply,
    onVersionsChanged,
}: VersionHistoryTabProps) {
    const [isSelectMode, setSelectMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [pendingDelete, setPendingDelete] = useState<{ ids: string[] } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [pendingApplyId, setPendingApplyId] = useState<string | null>(null)
    const [isApplying, setIsApplying] = useState(false)

    // La plus récente en premier — l'ordre chronologique inverse de versionNumbers (qui numérote v1 = la plus ancienne).
    const sortedVersions = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const mostRecentVersion = sortedVersions[0]

    function canDeleteVersion(version: ModuleVersion): boolean {
        return version.status === "draft" && version.createdByUserId === userId && version.id !== module.officialVersionId
    }

    const hasDeletableVersions = versions.some(canDeleteVersion)

    function toggleSelectMode() {
        setSelectMode((prev) => !prev)
        setSelectedIds(new Set())
    }

    function toggleSelected(versionId: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(versionId)) next.delete(versionId)
            else next.add(versionId)
            return next
        })
    }

    async function handleConfirmDelete() {
        if (!pendingDelete) return
        setIsDeleting(true)
        if (pendingDelete.ids.length === 1) {
            await deleteModuleVersion(pendingDelete.ids[0])
        } else {
            await deleteModuleVersions(pendingDelete.ids)
        }
        onVersionsChanged(versions.filter((v) => !pendingDelete.ids.includes(v.id)))
        setSelectedIds(new Set())
        setSelectMode(false)
        setIsDeleting(false)
        setPendingDelete(null)
    }

    /**
     * Applique directement — sauf si la version choisie n'est PAS la plus
     * récemment créée du module, auquel cas on avertit d'abord (peu
     * importe qui l'applique) : appliquer une version plus ancienne que
     * la dernière publiée est une action légitime (ex. revenir en
     * arrière après un problème), mais assez inhabituelle pour mériter
     * une confirmation explicite plutôt qu'un clic accidentel silencieux.
     */
    function handleApplyClick(versionId: string) {
        if (mostRecentVersion && versionId !== mostRecentVersion.id) {
            setPendingApplyId(versionId)
        } else {
            void executeApply(versionId)
        }
    }

    async function executeApply(versionId: string) {
        setIsApplying(true)
        await onApply(versionId)
        setIsApplying(false)
        setPendingApplyId(null)
    }

    const selectedCount = selectedIds.size
    const pendingApplyVersion = versions.find((v) => v.id === pendingApplyId)
    const pendingApplyVersionNumber = pendingApplyId ? versionNumbers.get(pendingApplyId) : undefined
    const mostRecentVersionNumber = mostRecentVersion ? versionNumbers.get(mostRecentVersion.id) : undefined

    return (
        <div className={styles.tab}>
            <div className={styles.header}>
                {isSelectMode && selectedCount > 0 ? (
                    <div className={styles.contextualBar}>
                        <span className={styles.selectionCount}>{selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}</span>
                        <div className={styles.contextualActions}>
                            <Button
                                label="Supprimer"
                                variant="danger"
                                size="sm"
                                onClick={() => setPendingDelete({ ids: Array.from(selectedIds) })}
                            />
                            <Button label="Annuler" variant="ghost" size="sm" onClick={toggleSelectMode} />
                        </div>
                    </div>
                ) : (
                    <Button
                        label={isSelectMode ? "Annuler" : "Sélectionner"}
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectMode}
                        disabled={!isSelectMode && !hasDeletableVersions}
                    />
                )}
            </div>

            <div className={styles.list}>
                {sortedVersions.map((version) => {
                    const previous = versions.find((v) => v.id === version.previousVersionId)
                    const changeSummary = summarizeContentDiff(previous?.content ?? null, version.content)

                    return (
                        <VersionHistoryRow
                            key={version.id}
                            version={version}
                            versionNumber={versionNumbers.get(version.id) ?? 0}
                            changeSummary={changeSummary}
                            isOfficial={version.id === module.officialVersionId}
                            canDelete={canDeleteVersion(version)}
                            canApply={canApply}
                            role={role}
                            isSelectMode={isSelectMode}
                            isSelected={selectedIds.has(version.id)}
                            onToggleSelect={() => toggleSelected(version.id)}
                            onDeleteSingle={() => setPendingDelete({ ids: [version.id] })}
                            onApply={() => handleApplyClick(version.id)}
                        />
                    )
                })}
            </div>

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title={pendingDelete && pendingDelete.ids.length > 1 ? `Supprimer ${pendingDelete.ids.length} versions ?` : "Supprimer cette version ?"}
                message="Cette action est irréversible. Le contenu de la ou des versions sélectionnées sera définitivement perdu."
                confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            <ConfirmDialog
                isOpen={pendingApplyId !== null}
                title={`Appliquer v${pendingApplyVersionNumber} plutôt que la plus récente ?`}
                message={`v${mostRecentVersionNumber} (publiée plus récemment${mostRecentVersion ? ", par " + mostRecentVersion.createdByName : ""}) existe déjà. Appliquer v${pendingApplyVersionNumber} à la place reste possible (ex. revenir en arrière après un problème), mais confirmez que c'est bien voulu.`}
                confirmLabel={isApplying ? "Application..." : "Appliquer quand même"}
                onConfirm={() => pendingApplyId && executeApply(pendingApplyId)}
                onCancel={() => setPendingApplyId(null)}
            />
        </div>
    )
}