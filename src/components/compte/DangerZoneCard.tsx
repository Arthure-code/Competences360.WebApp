"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import { supprimerMonCompte } from "@/_mocks/accountDeletion.actions"
import PageSubheader from "@/components/ui/PageSubheader"
import Button from "@/components/ui/Button"
import AccountDeletionDialog from "@/components/shared/AccountDeletionDialog"
import { submitDeletionRequest, cancelDeletionRequest } from "@/_mocks/accountDeletionRequests.mock"
import { formatLongDateLabel } from "@/lib/date"
import type { AccountDeletionFlow } from "@/lib/accountDeletion"
import type { AccountDeletionRequest } from "@/types/accountDeletionRequest"
import type { Role } from "@/constants/roles"
import styles from "./DangerZoneCard.module.css"

interface DangerZoneCardProps {
    flow: AccountDeletionFlow
    pendingRequest: AccountDeletionRequest | null
    userId: string
    userFullName: string
    /** Rôle "principal" pour la demande — gestionnaire > formateur > apprenant si cumulé, voir compte/page.tsx */
    role: Role
    /** Absent pour un apprenant — voir la note sur AccountDeletionRequest.organizationId */
    organizationId?: string
}

export default function DangerZoneCard({
    flow,
    pendingRequest: initialPendingRequest,
    userId,
    userFullName,
    role,
    organizationId,
}: DangerZoneCardProps) {
    const [isDialogOpen, setDialogOpen] = useState(false)
    const [pendingRequest, setPendingRequest] = useState(initialPendingRequest)
    const [erreur, setErreur] = useState<string | null>(null)
    const [enCours, setEnCours] = useState(false)

    function handleCloseDialog() {
        setDialogOpen(false)
    }

    /**
     * Suppression réelle et irréversible, réservée aux apprenants libres —
     * c'est l'API qui applique cette règle, pas cet écran.
     *
     * En cas de succès l'action ne rend pas la main : elle ferme la session
     * et redirige depuis le serveur. Ce qui suit ne s'exécute donc que sur un
     * refus.
     */
    async function handleConfirmImmediate() {
        if (enCours) return

        setEnCours(true)
        setErreur(null)

        const suppression = await supprimerMonCompte()

        setErreur(suppression.erreur ?? "La suppression du compte a échoué.")
        setEnCours(false)
    }

    async function handleSendRequest() {
        const request = await submitDeletionRequest({ userId, userFullName, role, organizationId })
        setPendingRequest(request)
        setDialogOpen(false)
    }

    async function handleCancelRequest() {
        if (!pendingRequest) return
        await cancelDeletionRequest(pendingRequest.id)
        setPendingRequest(null)
    }

    // Une demande est déjà en cours — remplace le bouton par l'état "en attente"
    if (pendingRequest) {
        return (
            <Card padding="lg" className={styles.card}>
                <PageSubheader
                    title="Zone sensible"
                    subtitle="Gérez la suppression définitive de votre compte utilisateur."
                />
                <div className={styles.pendingBox}>
                    <p className={styles.pendingTitle}>Demande de suppression de compte en cours</p>
                    <p className={styles.pendingMeta}>
                        Envoyée le {formatLongDateLabel(pendingRequest.requestedAt)}.
                        <br />
                        En attente de l'approbation de votre organisation.
                    </p>
                    <Button label="Annuler ma demande" variant="outline" onClick={handleCancelRequest} />
                </div>
            </Card>
        )
    }

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader
                title="Zone sensible"
                subtitle="Gérez la suppression définitive de votre compte utilisateur."
            />

            {flow.kind !== "blocked" && (
                <p className={styles.warning}>
                    Cette action est irréversible. Toutes vos données, y compris vos modules complétés et vos badges,
                    seront définitivement supprimées de nos serveurs.
                </p>
            )}

            {erreur && (
                <p className={styles.warning} role="alert">
                    {erreur}
                </p>
            )}

            <Button label="Supprimer mon compte" variant="danger" onClick={() => setDialogOpen(true)} />

            {flow.kind === "blocked" ? (
                <AccountDeletionDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    title={flow.title}
                    message={flow.message}
                    actions={[
                        { label: "Annuler", variant: "outline", onClick: handleCloseDialog },
                        {
                            label: "Inviter un gestionnaire par email",
                            variant: "secondary",
                            onClick: () => {
                                // TODO : rediriger vers la page Invitations une fois construite
                                handleCloseDialog()
                            },
                        },
                        {
                            label: "Nommer un gestionnaire parmis les formateurs",
                            variant: "secondary",
                            onClick: () => {
                                // TODO : rediriger vers la page Membres une fois construite
                                handleCloseDialog()
                            },
                        },
                    ]}
                />
            ) : (
                <AccountDeletionDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    title={flow.title}
                    message={flow.message}
                    actions={[
                        { label: flow.cancelLabel, variant: "outline", onClick: handleCloseDialog },
                        {
                            label: flow.confirmLabel,
                            variant: "secondary",
                            onClick: flow.kind === "immediate" ? handleConfirmImmediate : handleSendRequest,
                        },
                    ]}
                />
            )}
        </Card>
    )
}