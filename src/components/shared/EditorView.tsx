"use client"

import { useRouter } from "next/navigation"
import ContentEditor from "@/components/shared/content-editor/ContentEditor"
import { updateModuleVersionContent, deleteModuleVersion, createNewVersionInModule, publishVersion, unpublishVersion } from "@/_mocks/moduleVersions.actions"
import { applyOfficialVersion } from "@/_mocks/contentModules.actions"
import { getFullName } from "@/lib/user"
import { getCurrentSession } from "@/_mocks/users.mock"
import { routes } from "@/constants/routes"
import type { ModuleVersion, ModuleVersionContent } from "@/types/moduleVersion"
import type { Category } from "@/types/category"
import type { ReviewComment } from "@/types/reviewComment"

interface EditorViewProps {
    version: ModuleVersion
    /** true si CETTE version précise est l'officielle de son module — la vraie ligne de verrouillage, pas le statut draft/published */
    isOfficial: boolean
    /** true si un formateur AUTRE que le créateur a assigné cette version précise à son groupe (voir _mocks/assignments.mock.ts) */
    isAssignedByOthers: boolean
    versionNumber: number
    categories: Category[]
    userId: string
    organizationId: string
    /**
     * "formateur" ou "gestionnaire" — PAS l'objet de routes lui-même
     * (routes.formateur.contenu contient des fonctions, et Next.js
     * interdit de faire traverser une fonction du serveur vers un
     * composant client via une prop — seules des données sérialisables
     * passent cette frontière). `routes` est importé directement ici à la
     * place, ce qui est permis puisque ce fichier est déjà "use client" —
     * seule la traversée serveur→client pose problème, pas l'usage de
     * fonctions DANS un composant client.
     */
    role: "formateur" | "gestionnaire"
    /**
     * Réservé au gestionnaire — false côté formateur (jamais true, jamais
     * de bouton "Appliquer"). NE dépend PAS d'être propriétaire,
     * contrairement à isEditable : réviser le travail des autres
     * formateurs est justement le rôle du gestionnaire. Calculé par
     * l'appelant (chaque page.tsx sait déjà si le rôle courant a ce
     * droit), mais l'action elle-même (handleApplyOfficial) vit ICI, pas
     * dans l'appelant — un Server Component ne peut pas fournir un
     * handler qui fait du router.push côté client.
     */
    canApplyOfficial?: boolean
    userFullName: string
    comments: ReviewComment[]
}

/**
 * Partagé entre formateur et gestionnaire — au départ deux fichiers
 * séparés (FormateurEditorView/GestionnaireEditorView), mais l'écart
 * réel se limitait à 2 choses paramétrables (le groupe de routes, et
 * canApplyOfficial/onApplyOfficial) — pas assez pour justifier deux
 * fichiers, contrairement à ContenuView (onglet en plus + vraie logique
 * de données différente, elle reste séparée pour de bonnes raisons).
 *
 * Éditable en place si propriétaire ET pas officielle — draft OU published,
 * peu importe. Le verrouillage strict (fork obligatoire) ne s'applique
 * qu'à la version OFFICIELLE (jamais modifiée sous les apprenants qui
 * l'utilisent) et au contenu d'un collègue. "Publier"/"Dépublier" sont
 * tous deux en libre-service pour le créateur tant que ce n'est pas
 * officiel.
 */
export default function EditorView({
    version,
    isOfficial,
    isAssignedByOthers,
    versionNumber,
    categories,
    userId,
    organizationId,
    role,
    canApplyOfficial = false,
    userFullName,
    comments,
}: EditorViewProps) {
    const router = useRouter()
    const contenuRoutes = routes[role].contenu

    const isOwner = version.createdByUserId === userId
    const isEditable = isOwner && !isOfficial && !isAssignedByOthers
    // Réservé au gestionnaire qui révise le travail de quelqu'un d'autre, pas de sens de se commenter soi-même.
    // Basé sur role, pas canApplyOfficial : cette dernière exclut explicitement
    // le cas où version.id === module.officialVersionId (déjà officielle),
    // exactement le cas d'une version auto-appliquée en attente de révision
    // ("À réviser") — canApplyOfficial y serait faux alors que commenter doit
    // justement y être possible.
    const canComment = role === "gestionnaire" && !isOwner

    const readOnlyReason: "not-owner" | "official" | "assigned-by-others" | null = isEditable
        ? null
        : !isOwner
          ? "not-owner"
          : isOfficial
            ? "official"
            : "assigned-by-others"

    async function handleSave(content: ModuleVersionContent) {
        await updateModuleVersionContent(version.id, content)
    }

    async function handlePublishVersion() {
        // canApplyOfficial n'est vrai qu'en contexte gestionnaire (voir
        // les 2 page.tsx appelants) — son geste de publier compte alors
        // comme la révision elle-même, voir publishVersion.
        await publishVersion(version.id, canApplyOfficial ? userId : undefined)
        router.push(contenuRoutes.module(version.moduleId))
    }

    async function handleUnpublishVersion() {
        await unpublishVersion(version.id)
        router.refresh()
    }

    async function handleApplyOfficial() {
        await applyOfficialVersion(version.moduleId, version.id, userId)
        router.push(contenuRoutes.module(version.moduleId))
    }

    async function handleDelete() {
        await deleteModuleVersion(version.id)
        router.push(contenuRoutes.module(version.moduleId))
    }

    async function handleFork() {
        const { user } = await getCurrentSession()
        const newVersion = await createNewVersionInModule({
            moduleId: version.moduleId,
            sourceVersionId: version.id,
            organizationId,
            createdByUserId: userId,
            createdByName: getFullName(user),
            changeNote: `Nouvelle version de « ${version.content.title} »`,
        })
        if (newVersion) router.push(contenuRoutes.edit(newVersion.moduleId, newVersion.id))
    }

    return (
        <ContentEditor
            version={version}
            versionNumber={versionNumber}
            categories={categories}
            canPublishVersion={isEditable && version.status === "draft"}
            canUnpublish={isEditable && version.status === "published"}
            canApplyOfficial={canApplyOfficial}
            canDelete={isEditable && version.status === "draft"}
            readOnly={!isEditable}
            readOnlyReason={readOnlyReason}
            onSave={handleSave}
            onPublishVersion={handlePublishVersion}
            onUnpublishVersion={handleUnpublishVersion}
            onApplyOfficial={canApplyOfficial ? handleApplyOfficial : undefined}
            onDelete={handleDelete}
            onFork={handleFork}
            backHref={`${contenuRoutes.root}?onglet=draft`}
            comments={comments}
            currentUserId={userId}
            currentUserName={userFullName}
            canComment={canComment}
        />
    )
}