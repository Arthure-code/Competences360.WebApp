"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrashCan } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import CardAttributionFooter from "@/components/shared/CardAttributionFooter"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { moveModuleToTrash } from "@/_mocks/contentModules.actions"
import { routes } from "@/constants/routes"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./ContentModuleCard.module.css"

interface ContentModuleCardProps {
    module: ContentModule
    /** La version pertinente pour le tab courant (mon brouillon, ma publication, ou l'officielle) */
    displayVersion: ModuleVersion
    attributionLabel: string
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu, sinon un gestionnaire atterrissait sur les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
    /** Nombre de commentaires non résolus sur displayVersion, sert au badge "En révision" (voir getReviewBadgeLabel) */
    unresolvedCommentCount?: number
    /**
     * Épopée 4 — corbeille. Calculé par l'appelant (page.tsx, voir
     * canTrashModule dans lib/contentTrash.ts) : le créateur sur son
     * propre contenu, le gestionnaire sur tout — cette carte n'a pas
     * accès aux versions pour vérifier ça elle-même. Absent = aucun
     * bouton affiché plutôt qu'un bouton désactivé sans explication.
     */
    canTrash?: boolean
    /** Nécessaire pour l'appel à moveModuleToTrash — qui fait le geste, pas juste qui le voit */
    userId?: string
}

/**
 * displayVersion.reviewReason est posé quand un gestionnaire renvoie en
 * brouillon (voir revertToDraft, moduleVersions.actions.ts) et remis à
 * null seulement par un nouveau renvoi, jamais automatiquement effacé à
 * la resoumission, submittedForReviewAt distingue "encore à traiter" de
 * "déjà resoumis, en attente du gestionnaire". Sans ce badge, une version
 * renvoyée se confondrait avec un brouillon ordinaire dans "Privé", et le
 * formateur pourrait ne jamais remarquer qu'une action est attendue de
 * lui, voir la discussion sur le mécanisme de révision.
 */
function getReviewBadgeLabel(version: ModuleVersion, unresolvedCommentCount: number): string | undefined {
    if (!version.reviewReason) return undefined
    if (version.submittedForReviewAt) return "Resoumis, en attente de confirmation"
    if (unresolvedCommentCount > 0) {
        return `En révision : ${unresolvedCommentCount} commentaire${unresolvedCommentCount > 1 ? "s" : ""} à traiter`
    }
    return "Prêt à renvoyer"
}

export default function ContentModuleCard({
    module,
    displayVersion,
    attributionLabel,
    role,
    unresolvedCommentCount = 0,
    canTrash = false,
    userId,
}: ContentModuleCardProps) {
    const router = useRouter()
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const [isTrashing, setIsTrashing] = useState(false)

    const reviewBadgeLabel = getReviewBadgeLabel(displayVersion, unresolvedCommentCount)

    async function handleConfirmTrash() {
        if (!userId) return
        setIsTrashing(true)
        await moveModuleToTrash(module.id, userId, role === "gestionnaire")
        setConfirmOpen(false)
        router.refresh()
    }

    return (
        <div className={styles.cardWrapper}>
            <Card href={routes[role].contenu.module(module.id)} interactive padding="md" className={styles.card}>
                <h3 className={styles.title}>{displayVersion.content.title || "Module sans titre"}</h3>
                <p className={styles.description}>{displayVersion.content.description}</p>
                <CardAttributionFooter
                    attributionLabel={attributionLabel}
                    pendingBadgeLabel={
                        reviewBadgeLabel ??
                        (!module.officialVersionId && displayVersion.status === "published"
                            ? "En attente d'officialisation"
                            : undefined)
                    }
                />
            </Card>

            {canTrash && (
                <button
                    type="button"
                    className={styles.trashButton}
                    aria-label="Mettre ce module à la corbeille"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setConfirmOpen(true)
                    }}
                >
                    <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                </button>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Mettre ce module à la corbeille ?"
                message="Il restera récupérable pendant 21 jours, puis sera supprimé définitivement. Les apprenants qui y ont accès n'y auront plus accès entre-temps."
                confirmLabel={isTrashing ? "Envoi..." : "Mettre à la corbeille"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmTrash}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}