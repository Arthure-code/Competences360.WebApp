import Button from "@/components/ui/Button"
import PageSubheader from "@/components/ui/PageSubheader"
import type { Invitation } from "@/types/invitation"
import styles from "./SentInvitationsList.module.css"

interface SentInvitationsListProps {
    invitations: Invitation[]
    onCancel: (invitationId: string) => void
}

const STATUS_LABELS: Record<Invitation["status"], string> = {
    pending: "En attente",
    accepted: "Acceptée",
    expired: "Expirée",
}

/**
 * N'affiche jamais les invitations "accepted" — une fois acceptée, la
 * personne apparaît déjà dans le roster du groupe (Détail groupe), la
 * montrer ici en plus serait redondant avec une info déjà visible ailleurs.
 * Seules "pending" (annulable) et "expired" (historique utile) restent.
 */
export default function SentInvitationsList({ invitations, onCancel }: SentInvitationsListProps) {
    const visibleInvitations = invitations.filter((invitation) => invitation.status !== "accepted")
    if (visibleInvitations.length === 0) return null

    return (
        <div className={styles.wrapper}>
            <PageSubheader title="Invitations envoyées" count={visibleInvitations.length} />
            <div className={styles.list}>
                {visibleInvitations.map((invitation) => (
                    <div key={invitation.id} className={styles.item}>
                        <span className={styles.email}>{invitation.email}</span>
                        <div className={styles.right}>
                            <span className={`${styles.status} ${styles[invitation.status]}`}>
                                {STATUS_LABELS[invitation.status]}
                            </span>
                            {invitation.status === "pending" && (
                                <Button
                                    label="Annuler"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCancel(invitation.id)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}