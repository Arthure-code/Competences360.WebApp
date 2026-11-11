"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import CardAttributionFooter from "@/components/shared/CardAttributionFooter"
import VersionStatusBadge from "@/components/shared/VersionStatusBadge"
import { applyOfficialVersion } from "@/_mocks/contentModules.actions"
import { revertToDraft } from "@/_mocks/moduleVersions.actions"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import { routes } from "@/constants/routes"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./PendingReviewCard.module.css"

interface PendingReviewCardProps {
    module: ContentModule
    /** La version déjà appliquée automatiquement, celle qu'on confirme ou renvoie */
    displayVersion: ModuleVersion
    attributionLabel: string
    gestionnaireUserId: string
}

/**
 * Distincte de ContentModuleCard, celle-ci porte des actions rapides
 * (Confirmer/Renvoyer) en plus d'un lien vers l'éditeur (le titre, pas
 * toute la carte, un <a> ne peut pas envelopper de vrais <button>,
 * imbrication d'éléments interactifs invalide en HTML). Mène directement
 * à l'éditeur (pas au résumé du module) : c'est là que vivent les
 * commentaires de révision, un détour par le résumé forcerait un clic de
 * plus juste pour arriver à l'endroit où on peut vraiment réviser.
 * "Confirmer" réapplique la MÊME version déjà officielle
 * (applyOfficialVersion avec le même id), ça ne change rien au pointeur,
 * seulement hasBeenReviewedByGestionnaire passe à true et le module
 * quitte définitivement cette file.
 *
 * "Renvoyer" demande une raison obligatoire avant de confirmer, un peu
 * comme un message de commit, jamais coché, juste du contexte pour que
 * le formateur sache quoi corriger.
 */
export default function PendingReviewCard({
    module,
    displayVersion,
    attributionLabel,
    gestionnaireUserId,
}: PendingReviewCardProps) {
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isRevertModalOpen, setRevertModalOpen] = useState(false)
    const [reason, setReason] = useState("")

    async function handleConfirm() {
        setIsProcessing(true)
        await applyOfficialVersion(module.id, displayVersion.id, gestionnaireUserId)
        router.refresh()
    }

    async function handleRevertConfirm() {
        if (!reason.trim()) return
        setIsProcessing(true)
        const { user } = await getCurrentSession()
        await revertToDraft(displayVersion.id, gestionnaireUserId, getFullName(user), reason.trim())
        setRevertModalOpen(false)
        setReason("")
        router.refresh()
    }

    return (
        <Card padding="md" className={styles.card}>
            <div className={styles.titleRow}>
                <Link href={routes.gestionnaire.contenu.edit(module.id, displayVersion.id)} className={styles.title}>
                    {displayVersion.content.title || "Module sans titre"}
                </Link>
                <VersionStatusBadge version={displayVersion} isOfficial isPendingReview />
            </div>
            <p className={styles.description}>{displayVersion.content.description}</p>

            <CardAttributionFooter attributionLabel={attributionLabel} />

            <div className={styles.actions}>
                <Button
                    label="Renvoyer en brouillon"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevertModalOpen(true)}
                    disabled={isProcessing}
                />
                <Button
                    label={isProcessing ? "..." : "Confirmer"}
                    variant="primary"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                />
            </div>

            <Modal
                isOpen={isRevertModalOpen}
                onClose={() => setRevertModalOpen(false)}
                ariaLabel="Renvoyer en brouillon"
            >
                <h2 className={styles.modalTitle}>Renvoyer en brouillon</h2>
                <p className={styles.modalHint}>
                    Expliquez au formateur ce qui doit être corrigé. Cette raison lui sera visible.
                </p>
                <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={styles.modalTextarea}
                    placeholder="Ex. Le titre de l'activité 2 contient une erreur, et le score maximal de l'exercice 3 semble incorrect."
                    rows={4}
                    autoFocus
                />
                <div className={styles.modalActions}>
                    <Button label="Annuler" variant="ghost" onClick={() => setRevertModalOpen(false)} />
                    <Button
                        label={isProcessing ? "Envoi..." : "Renvoyer"}
                        onClick={handleRevertConfirm}
                        disabled={isProcessing || !reason.trim()}
                    />
                </div>
            </Modal>
        </Card>
    )
}