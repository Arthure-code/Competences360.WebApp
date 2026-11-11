"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { getMyGroups } from "@/_mocks/groups.mock"
import { addGroupMembership, removeGroupMembership } from "@/_mocks/groupMemberships.actions"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import type { Group } from "@/types/group"
import styles from "./ManageApprenantGroupsModal.module.css"

interface ManageApprenantGroupsModalProps {
    isOpen: boolean
    onClose: () => void
    apprenant: OrganizationMember
    organizationGroups: Group[]
}

/**
 * getMyGroups (vrai, _mocks/groups.mock.ts) accepte un id d'une AUTRE
 * personne que l'appelant — exactement ce qu'on avait vérifié dans son
 * commentaire ("le personnel doit savoir à quels groupes appartient un
 * apprenant"). addGroupMembership/removeGroupMembership (vrais,
 * _mocks/groupMemberships.actions.ts) aussi réels — pas de repli
 * temporaire nécessaire ici, tout existe déjà côté backend.
 */
export default function ManageApprenantGroupsModal({ isOpen, onClose, apprenant, organizationGroups }: ManageApprenantGroupsModalProps) {
    const router = useRouter()
    const [currentGroupIds, setCurrentGroupIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) return
        setIsLoading(true)
        void getMyGroups(apprenant.id).then((groups) => {
            setCurrentGroupIds(new Set(groups.map((g) => g.id)))
            setIsLoading(false)
        })
    }, [isOpen, apprenant.id])

    async function handleToggle(groupId: string, isMember: boolean) {
        setIsSaving(groupId)
        if (isMember) {
            await removeGroupMembership(groupId, apprenant.id)
            setCurrentGroupIds((prev) => {
                const next = new Set(prev)
                next.delete(groupId)
                return next
            })
        } else {
            await addGroupMembership(groupId, apprenant.id)
            setCurrentGroupIds((prev) => new Set(prev).add(groupId))
        }
        setIsSaving(null)
        router.refresh()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} ariaLabel={`Gérer les groupes de ${apprenant.fullName}`} maxWidth={440}>
            <h2 className={styles.title}>Groupes de {apprenant.fullName}</h2>

            {isLoading ? (
                <p className={styles.hint}>Chargement...</p>
            ) : organizationGroups.length === 0 ? (
                <p className={styles.hint}>Aucun groupe dans cette organisation.</p>
            ) : (
                <div className={styles.list}>
                    {organizationGroups.map((group) => {
                        const isMember = currentGroupIds.has(group.id)
                        return (
                            <div key={group.id} className={styles.row}>
                                <span className={styles.groupName}>{group.name}</span>
                                <Button
                                    label={isSaving === group.id ? "..." : isMember ? "Retirer" : "Ajouter"}
                                    variant={isMember ? "outline" : "ghost"}
                                    onClick={() => handleToggle(group.id, isMember)}
                                    disabled={isSaving !== null}
                                />
                            </div>
                        )
                    })}
                </div>
            )}

            <div className={styles.closeRow}>
                <Button label="Fermer" onClick={onClose} />
            </div>
        </Modal>
    )
}
