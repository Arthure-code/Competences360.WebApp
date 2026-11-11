"use client"

import ContentEditor from "@/components/shared/content-editor/ContentEditor"
import { routes } from "@/constants/routes"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { Category } from "@/types/category"

interface AdminContentPreviewViewProps {
    version: ModuleVersion
    versionNumber: number
    categories: Category[]
    adminId: string
}

/**
 * Enveloppe client minimale — onSave doit être une fonction, impossible à
 * passer depuis un composant serveur (page.tsx) sans "use server". Ici,
 * un simple no-op local : readOnly est déjà vrai, ContentEditor ne
 * l'appelle jamais réellement, mais sa prop reste requise.
 */
export default function AdminContentPreviewView({ version, versionNumber, categories, adminId }: AdminContentPreviewViewProps) {
    return (
        <ContentEditor
            version={version}
            versionNumber={versionNumber}
            categories={categories}
            canPublishVersion={false}
            canUnpublish={false}
            canApplyOfficial={false}
            canDelete={false}
            readOnly
            readOnlyReason="preview"
            onSave={async () => {}}
            backHref={version.organizationId
                ? routes.admin.organisations.bySlug(version.organizationId)
                : routes.admin.contenu.module(version.moduleId)}
            comments={[]}
            currentUserId={adminId}
            currentUserName=""
            canComment={false}
        />
    )
}
