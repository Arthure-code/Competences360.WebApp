"use client"

import ContentEditor from "@/components/shared/content-editor/ContentEditor"
import { routes } from "@/constants/routes"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { Category } from "@/types/category"

interface PreviewEditorViewProps {
    version: ModuleVersion
    versionNumber: number
    categories: Category[]
    role: "formateur" | "gestionnaire"
}

async function noop() {}

/**
 * Lecture seule forcée pour tout le monde, même le propriétaire, pas
 * seulement ceux qui n'ont pas les droits d'édition. Sert à tester une
 * version (exercices interactifs) sans risquer de la modifier par
 * accident, particulièrement utile pendant une révision. Réutilise
 * ContentEditor directement (pas EditorView, qui calcule des permissions
 * qui n'ont pas de sens ici) : tout est verrouillé, aucun handler de
 * mutation n'est jamais vraiment appelé, comments est volontairement
 * vide, pas de discussion de révision à afficher dans un simple aperçu.
 */
export default function PreviewEditorView({ version, versionNumber, categories, role }: PreviewEditorViewProps) {
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
            onSave={noop}
            backHref={routes[role].contenu.module(version.moduleId)}
            comments={[]}
            currentUserId=""
            currentUserName=""
            canComment={false}
        />
    )
}
