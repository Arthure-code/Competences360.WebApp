"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ContentEditor from "@/components/shared/content-editor/ContentEditor"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import {
    adminUpdateModuleVersionContent,
    adminDeleteModuleVersion,
    adminPublishVersion,
    adminUnpublishVersion,
    adminApplyOfficialVersion,
} from "@/_mocksAdmin/adminContent.actions"
import { routes } from "@/constants/routes"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { Category } from "@/types/category"

interface AdminEditorViewProps {
    version: ModuleVersion
    isOfficial: boolean
    /** Le MODULE a-t-il déjà une version officielle, peu importe laquelle — décide si republier exige une confirmation. */
    hasOfficialVersion: boolean
    versionNumber: number
    categories: Category[]
    adminId: string
    adminName: string
}

/**
 * Modèle simplifié — un seul "Publier", pas "Publier" PUIS "Appliquer"
 * séparément (décidé ensemble : Admin est seul sur ce contenu, aucune
 * révision à 2 personnes contrairement à formateur/gestionnaire, donc
 * aucune raison de garder 2 étapes). "Publier" fait les deux d'un coup en
 * interne (adminPublishVersion puis adminApplyOfficialVersion) — le
 * bouton "Appliquer" séparé de ContentEditor reste cadré à false, jamais
 * affiché pour Admin.
 *
 * Confirmation AVANT de publier — seulement si le module a DÉJÀ une
 * version officielle (on remplace ce que les orgs voient), jamais pour
 * une première publication (rien à casser).
 */
export default function AdminEditorView({
    version,
    isOfficial,
    hasOfficialVersion,
    versionNumber,
    categories,
    adminId,
    adminName,
}: AdminEditorViewProps) {
    const router = useRouter()
    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)

    const isOwner = version.createdByUserId === adminId
    const isEditable = isOwner && !isOfficial

    async function handleSave(content: Parameters<typeof adminUpdateModuleVersionContent>[1]) {
        await adminUpdateModuleVersionContent(version.id, content)
    }

    /** Vrai geste de publication — fait publier + appliquer ensemble, un seul "Publier" pour Admin. */
    async function reallyPublish() {
        setIsPublishing(true)
        try {
            await adminPublishVersion(version.id)
            await adminApplyOfficialVersion(version.moduleId, version.id)
            router.push(routes.admin.contenu.module(version.moduleId))
        } finally {
            setIsPublishing(false)
            setConfirmPublishOpen(false)
        }
    }

    async function handlePublishClick(): Promise<void> {
        // Première publication (rien d'actif à remplacer) → direct, aucune friction nécessaire.
        // Republier par-dessus un module déjà actif → confirmation d'abord (reallyPublish
        // n'est alors PAS appelé ici, mais depuis le bouton de la modale).
        if (hasOfficialVersion) {
            setConfirmPublishOpen(true)
        } else {
            await reallyPublish()
        }
    }

    async function handleUnpublishVersion() {
        await adminUnpublishVersion(version.id)
        router.refresh()
    }

    async function handleDelete() {
        await adminDeleteModuleVersion(version.id)
        router.push(routes.admin.contenu.root)
    }

    return (
        <>
            <ContentEditor
                version={version}
                versionNumber={versionNumber}
                categories={categories}
                canPublishVersion={isEditable && version.status === "draft"}
                canUnpublish={isEditable && version.status === "published"}
                canApplyOfficial={false}
                canDelete={isEditable && version.status === "draft"}
                readOnly={!isEditable}
                readOnlyReason={!isOwner ? "not-owner" : isOfficial ? "official" : null}
                onSave={handleSave}
                onPublishVersion={handlePublishClick}
                onUnpublishVersion={handleUnpublishVersion}
                onDelete={handleDelete}
                backHref={`${routes.admin.contenu.root}?onglet=base`}
                comments={[]}
                currentUserId={adminId}
                currentUserName={adminName}
                canComment={false}
            />

            <Modal isOpen={confirmPublishOpen} onClose={() => setConfirmPublishOpen(false)} ariaLabel="Confirmer la publication" maxWidth={440}>
                <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Publier par-dessus la version active ?</h2>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--color-text-muted, #6b7280)" }}>
                    Ce module est déjà en ligne — les organisations qui l'utilisent verront vos changements dès que
                    vous confirmez.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <Button label="Annuler" variant="outline" onClick={() => setConfirmPublishOpen(false)} />
                    <Button label={isPublishing ? "Publication..." : "Oui, publier"} onClick={reallyPublish} disabled={isPublishing} />
                </div>
            </Modal>
        </>
    )
}