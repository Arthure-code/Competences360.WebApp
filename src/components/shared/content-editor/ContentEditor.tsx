"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faFloppyDisk } from "@fortawesome/free-solid-svg-icons"
import { resubmitForReview } from "@/_mocks/moduleVersions.actions"
import NiveauSidebar from "./NiveauSidebar"
import ModuleInfoPanel from "./ModuleInfoPanel"
import ActivityWorkspace from "./ActivityWorkspace"
import ExternalLinksPanel from "./ExternalLinksPanel"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { VERSION_STATUS_LABELS } from "@/constants/moduleVersionStatus"
import type { ModuleVersion, ModuleVersionContent, NiveauDraft } from "@/types/moduleVersion"
import { chargerBrouillon, effacerBrouillon, enregistrerBrouillon } from "@/_mocks/drafts.actions"
import type { Category } from "@/types/category"
import type { ReviewComment } from "@/types/reviewComment"
import styles from "./ContentEditor.module.css"

type ReadOnlyReason = "not-owner" | "official" | "assigned-by-others" | "preview" | null

const READ_ONLY_MESSAGES: Record<Exclude<ReadOnlyReason, null>, string> = {
    "not-owner": "Ce n'est pas votre contenu, vous pouvez le consulter, mais pas le modifier en place.",
    official:
        "C'est la version officielle du module, verrouillée pour ne jamais changer sous les apprenants qui l'utilisent.",
    "assigned-by-others":
        "Un collègue a assigné cette version précise à son groupe, la modifier en place changerait son contenu en cours d'utilisation.",
    preview: "Aperçu, testez les exercices librement, rien ici ne peut être modifié.",
}

interface ContentEditorProps {
    version: ModuleVersion
    /** Position chronologique parmi les versions de ce module — v1 = la plus ancienne. Affiché avant le titre pour situer d'un coup d'œil. */
    versionNumber: number
    categories: Category[]
    /** draft -> published, en libre-service par le créateur (formateur ou gestionnaire), instantané, aucune approbation requise */
    canPublishVersion: boolean
    /** published -> draft, symétrique de canPublishVersion — seulement si pas encore officielle (voir EditorView) */
    canUnpublish: boolean
    /** published -> officiel du module — réservé au gestionnaire, jamais le créateur lui-même (même sur son propre contenu) */
    canApplyOfficial: boolean
    /** Le créateur peut supprimer son propre brouillon (jamais une version publiée/officielle) */
    canDelete: boolean
    /**
     * false pour tout ce qui n'est pas éditable en place — propriétaire ET
     * pas la version officielle ET pas assignée par un collègue (voir
     * EditorView). Verrouille les champs (CSS pointer-events, pas juste
     * visuel) et coupe la sauvegarde automatique ; propose de créer une
     * nouvelle version à la place.
     */
    readOnly: boolean
    /** Pourquoi readOnly est vrai, pour afficher un message précis plutôt qu'un message générique qui ne correspond plus forcément à la vraie raison. */
    readOnlyReason?: ReadOnlyReason
    onSave: (content: ModuleVersionContent) => Promise<void>
    onPublishVersion?: () => Promise<void>
    onUnpublishVersion?: () => Promise<void>
    onApplyOfficial?: () => Promise<void>
    onDelete?: () => Promise<void>
    onFork?: () => Promise<void>
    /**
     * Destination du lien "Retour" — calculée par l'appelant (EditorView),
     * qui connaît déjà le rôle courant. Jamais routes.formateur codé en
     * dur ici (voir le commentaire juste en dessous, "le même composant
     * sert à n'importe quel rôle"). Pointe vers la grille (onglet Privé),
     * pas la page du module précis : un module tout juste créé n'a pas
     * encore assez d'historique pour que sa propre page s'affiche
     * proprement — la grille, elle, fonctionne toujours.
     */
    backHref: string
    comments: ReviewComment[]
    currentUserId: string
    currentUserName: string
    /** true seulement pour le gestionnaire en train de réviser (readOnly, pas propriétaire) — voir CommentThread */
    canComment: boolean
}

type PanelSelection = "module-info" | "external-links" | string

/**
 * Coquille complète, pilotée par config — le même composant sert à
 * n'importe quel rôle créateur de contenu (formateur, gestionnaire, une
 * équipe créant du contenu global à terme). Les permissions
 * (canPublishVersion/canUnpublish/canApplyOfficial/readOnly) déterminent
 * quels boutons apparaissent — jamais un rôle codé en dur ici.
 */
export default function ContentEditor({
    version,
    versionNumber,
    categories,
    canPublishVersion,
    canUnpublish,
    canApplyOfficial,
    canDelete,
    readOnly,
    readOnlyReason = null,
    onSave,
    onPublishVersion,
    onUnpublishVersion,
    onApplyOfficial,
    onDelete,
    onFork,
    backHref,
    comments,
    currentUserId,
    currentUserName,
    canComment,
}: ContentEditorProps) {
    const draftKey = `content-draft:${version.id}`
    const [content, setContent] = useState<ModuleVersionContent>(version.content)
    const [brouillonCharge, setBrouillonCharge] = useState(false)
    const [selectedPanel, setSelectedPanel] = useState<PanelSelection>("module-info")
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isForking, setIsForking] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isUnpublishing, setIsUnpublishing] = useState(false)
    const [isResubmitting, setIsResubmitting] = useState(false)
    const [resubmitError, setResubmitError] = useState<string | null>(null)

    // Reprend le brouillon enregistré pour cette version, s'il existe.
    useEffect(() => {
        let annule = false
        chargerBrouillon<ModuleVersionContent>(draftKey).then((brouillon) => {
            if (annule) return
            if (brouillon) setContent(brouillon)
            setBrouillonCharge(true)
        })
        return () => {
            annule = true
        }
    }, [draftKey])

    // Brouillon enregistré à chaque changement : survit à un rafraîchissement ou un changement de page. Jamais en lecture seule.
    useEffect(() => {
        if (readOnly || !brouillonCharge) return
        enregistrerBrouillon(draftKey, content)
    }, [draftKey, content, readOnly, brouillonCharge])

    // "Sauvegarde serveur" simulée, débattue pour ne pas spammer à chaque frappe.
    useEffect(() => {
        if (readOnly) return
        setIsSaving(true)
        const timeout = setTimeout(async () => {
            await onSave(content)
            setLastSavedAt(new Date())
            setIsSaving(false)
        }, 1000)
        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, readOnly])

    function addNiveau() {
        const newNiveau: NiveauDraft = {
            id: crypto.randomUUID(),
            slug: "",
            index: content.niveaux.length + 1,
            title: "Nouvelle activité",
            difficulty: "novice",
            description: "",
            practiceItems: [],
            durationMinutes: 10,
            exercises: [],
        }
        setContent((prev) => ({ ...prev, niveaux: [...prev.niveaux, newNiveau] }))
        setSelectedPanel(newNiveau.id)
    }

    function updateNiveau(niveauId: string, patch: Partial<NiveauDraft>) {
        setContent((prev) => ({
            ...prev,
            niveaux: prev.niveaux.map((n) => (n.id === niveauId ? { ...n, ...patch } : n)),
        }))
    }

    function removeNiveau(niveauId: string) {
        setContent((prev) => ({
            ...prev,
            niveaux: prev.niveaux.filter((n) => n.id !== niveauId).map((n, i) => ({ ...n, index: i + 1 })),
        }))
        if (selectedPanel === niveauId) setSelectedPanel("module-info")
    }

    function moveNiveau(niveauId: string, direction: -1 | 1) {
        setContent((prev) => {
            const index = prev.niveaux.findIndex((n) => n.id === niveauId)
            const newIndex = index + direction
            if (newIndex < 0 || newIndex >= prev.niveaux.length) return prev
            const next = [...prev.niveaux]
                ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
            return { ...prev, niveaux: next.map((n, i) => ({ ...n, index: i + 1 })) }
        })
    }

    const selectedNiveau = content.niveaux.find((n) => n.id === selectedPanel) ?? null

    // Agrège les commentaires de l'activité elle-même ET de tous ses exercices — pour repérer d'un coup d'œil dans la barre latérale, sans avoir à ouvrir chaque activité.
    const commentCounts: Record<string, { total: number; unresolved: number }> = {}
    for (const niveau of content.niveaux) {
        const exerciseIds = new Set(niveau.exercises.map((exercise) => exercise.id))
        const relevant = comments.filter(
            (comment) =>
                (comment.target === "niveau" && comment.targetId === niveau.id) ||
                (comment.target === "exercise" && exerciseIds.has(comment.targetId))
        )
        commentCounts[niveau.id] = { total: relevant.length, unresolved: relevant.filter((c) => !c.resolved).length }
    }
    const unresolvedTotalCount = comments.filter((c) => !c.resolved).length
    const awaitingResubmission = Boolean(version.reviewReason) && !version.submittedForReviewAt

    async function handleDelete() {
        if (!onDelete) return
        setIsDeleting(true)
        await onDelete()
        // Le brouillon n'a plus de raison d'être une fois la version supprimée.
        await effacerBrouillon(draftKey)
        setIsDeleting(false)
        setDeleteDialogOpen(false)
    }

    async function handleFork() {
        if (!onFork) return
        setIsForking(true)
        await onFork()
        setIsForking(false)
    }

    async function handlePublish() {
        if (!onPublishVersion) return
        setIsPublishing(true)
        await onPublishVersion()
        setIsPublishing(false)
    }

    async function handleUnpublish() {
        if (!onUnpublishVersion) return
        setIsUnpublishing(true)
        await onUnpublishVersion()
        setIsUnpublishing(false)
    }

    /**
     * Bloqué tant que des commentaires non résolus existent, revérifié
     * côté serveur au moment même du clic (pas le compte affiché à
     * l'ouverture de la page) : si le gestionnaire vient d'ajouter un
     * commentaire, la resoumission échoue avec un message clair plutôt
     * que de réussir en l'ignorant, voir la discussion sur le mécanisme
     * de révision.
     */
    async function handleResubmit() {
        setIsResubmitting(true)
        setResubmitError(null)
        const result = await resubmitForReview(version.id)
        if (!result.success) {
            setResubmitError(
                `${result.unresolvedCount} commentaire${result.unresolvedCount > 1 ? "s" : ""} encore non résolu${result.unresolvedCount > 1 ? "s" : ""}, impossible de renvoyer.`
            )
        }
        setIsResubmitting(false)
    }

    /** Bouton "Enregistrer" manuel — contourne le débat, sauvegarde immédiate. En plus de l'auto-save, pas à la place : purement rassurant (façon Canva). */
    async function handleManualSave() {
        setIsSaving(true)
        await onSave(content)
        setLastSavedAt(new Date())
        setIsSaving(false)
    }

    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.topbar}>
                    <div className={styles.topbarInfo}>
                        <Link href={backHref} className={styles.backLink}>
                            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                            Retour au contenu
                        </Link>
                        <span className={styles.versionNumberBadge}>v{versionNumber}</span>
                        <span className={styles.moduleTitle}>{content.title || "Module sans titre"}</span>
                        <span className={styles.statusBadge}>{VERSION_STATUS_LABELS[version.status]}</span>
                    </div>
                    <div className={styles.topbarActions}>
                        {!readOnly && (
                            <div className={styles.saveGroup}>
                                <span className={styles.saveIndicator}>
                                    {isSaving
                                        ? "Enregistrement..."
                                        : lastSavedAt
                                            ? `Enregistré à ${lastSavedAt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}`
                                            : ""}
                                </span>
                                <button
                                    type="button"
                                    className={styles.manualSaveButton}
                                    onClick={handleManualSave}
                                    disabled={isSaving}
                                    aria-label="Enregistrer maintenant"
                                    title="Enregistrer maintenant"
                                >
                                    <FontAwesomeIcon icon={faFloppyDisk} />
                                </button>
                            </div>
                        )}
                        {canDelete && !readOnly && (
                            <Button label="Supprimer" variant="ghost" onClick={() => setDeleteDialogOpen(true)} />
                        )}
                        {canUnpublish && !readOnly && (
                            <Button
                                label={isUnpublishing ? "Dépublication..." : "Dépublier"}
                                variant="ghost"
                                onClick={handleUnpublish}
                                disabled={isUnpublishing}
                            />
                        )}
                        {canPublishVersion && !readOnly && (
                            <Button
                                label={isPublishing ? "Publication..." : "Publier"}
                                variant="secondary"
                                onClick={handlePublish}
                                disabled={isPublishing}
                            />
                        )}
                        {canApplyOfficial && !readOnly && (
                            <Button label="Appliquer au module" variant="primary" onClick={onApplyOfficial} />
                        )}
                        {awaitingResubmission && !readOnly && (
                            <Button
                                label={isResubmitting ? "Envoi..." : "Renvoyer au gestionnaire"}
                                variant="primary"
                                onClick={handleResubmit}
                                disabled={isResubmitting || unresolvedTotalCount > 0}
                            />
                        )}
                        {readOnly && onFork && (
                            <Button
                                label={isForking ? "Création en cours..." : "Créer une nouvelle version"}
                                variant="primary"
                                onClick={handleFork}
                                disabled={isForking}
                            />
                        )}
                    </div>
                </div>

                {readOnly && (
                    <div className={styles.readOnlyBanner}>
                        {readOnlyReason ? READ_ONLY_MESSAGES[readOnlyReason] : "Ce contenu n'est pas modifiable ici."}
                    </div>
                )}

                {version.reviewReason && (
                    <div className={styles.reviewBanner}>
                        <strong>Renvoyé par {version.reviewedByName ?? "le gestionnaire"} :</strong> {version.reviewReason}
                        {version.submittedForReviewAt ? (
                            <span className={styles.reviewBannerStatus}> (resoumis, en attente de confirmation)</span>
                        ) : unresolvedTotalCount > 0 ? (
                            <span className={styles.reviewBannerStatus}>
                                {" "}
                                ({unresolvedTotalCount} commentaire{unresolvedTotalCount > 1 ? "s" : ""} à traiter avant de
                                renvoyer)
                            </span>
                        ) : (
                            <span className={styles.reviewBannerStatus}> (prêt à renvoyer)</span>
                        )}
                    </div>
                )}

                {resubmitError && <div className={styles.resubmitError}>{resubmitError}</div>}

                <div className={styles.body}>
                    <NiveauSidebar
                        niveaux={content.niveaux}
                        selectedId={selectedPanel}
                        onSelect={setSelectedPanel}
                        onAdd={addNiveau}
                        onRemove={removeNiveau}
                        onMove={moveNiveau}
                        commentCounts={commentCounts}
                        readOnly={readOnly}
                        externalLinksCount={content.externalLinks.length}
                    />

                    <div className={styles.mainPanel}>
                        {selectedPanel === "module-info" ? (
                            <ModuleInfoPanel
                                content={content}
                                categories={categories}
                                onChange={(patch) => setContent((prev) => ({ ...prev, ...patch }))}
                                readOnly={readOnly}
                            />
                        ) : selectedPanel === "external-links" ? (
                            <ExternalLinksPanel
                                links={content.externalLinks}
                                onChange={(externalLinks) => setContent((prev) => ({ ...prev, externalLinks }))}
                                readOnly={readOnly}
                            />
                        ) : selectedNiveau ? (
                            <ActivityWorkspace
                                niveau={selectedNiveau}
                                onChange={(patch) => updateNiveau(selectedNiveau.id, patch)}
                                versionId={version.id}
                                comments={comments}
                                currentUserId={currentUserId}
                                currentUserName={currentUserName}
                                canComment={canComment}
                                readOnly={readOnly}
                            />
                        ) : null}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Supprimer ce brouillon ?"
                message="Cette action est irréversible. Tout le contenu de ce brouillon sera définitivement perdu."
                confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialogOpen(false)}
            />
        </>
    )
}