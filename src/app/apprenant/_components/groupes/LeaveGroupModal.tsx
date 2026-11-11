"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { removeGroupMembership } from "@/_mocks/groupMemberships.actions"
import { routes } from "@/constants/routes"
import type { Group } from "@/types/group"
import styles from "./LeaveGroupModal.module.css"

interface LeaveGroupModalProps {
    isOpen: boolean
    onClose: () => void
    group: Group
    userId: string
    /**
     * TODO : détection précise à brancher, nécessite de vérifier la
     * progression réelle de CET apprenant dans CE groupe (vit dans le
     * localStorage, voir useNiveauProgress.ts, pas dans ApprenantSummary,
     * une vue formateur). En attendant, true par défaut : le message
     * prudent (progression conservée, mais départ immédiat) s'applique
     * toujours, jamais le message léger à tort.
     */
    hasProgress?: boolean
}

/**
 * Départ volontaire, réversible (voir removeGroupMembership,
 * groupMemberships.actions.ts, pose leftAt plutôt que de supprimer) —
 * jusqu'à la fin de la fenêtre de rétention (voir lib/dataRetention.ts),
 * après quoi la progression nommée est anonymisée, pas juste supprimée
 * en silence.
 */
export default function LeaveGroupModal({ isOpen, onClose, group, userId, hasProgress = true }: LeaveGroupModalProps) {
    const router = useRouter()
    const [isLeaving, setIsLeaving] = useState(false)

    async function handleConfirm() {
        setIsLeaving(true)
        await removeGroupMembership(group.id, userId)
        router.push(routes.apprenant.groupes.root)
        router.refresh()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} ariaLabel={`Quitter ${group.name}`}>
            <h2 className={styles.title}>Quitter {group.name} ?</h2>

            {hasProgress ? (
                <p className={styles.message}>
                    Votre progression sera conservée si vous revenez, mais vous perdrez l'accès au contenu assigné
                    immédiatement.
                </p>
            ) : (
                <p className={styles.message}>Vous n'avez pas encore commencé de contenu dans ce groupe.</p>
            )}

            <p className={styles.joinCodeReminder}>
                Pour revenir plus tard, vous aurez besoin du code de jonction du groupe : notez-le avant de continuer si
                vous voulez pouvoir revenir. <strong>{group.joinCode}</strong>
            </p>

            <div className={styles.actions}>
                <Button label="Annuler" variant="ghost" onClick={onClose} />
                <Button
                    label={isLeaving ? "Départ..." : "Quitter le groupe"}
                    variant="danger"
                    onClick={handleConfirm}
                    disabled={isLeaving}
                />
            </div>
        </Modal>
    )
}
