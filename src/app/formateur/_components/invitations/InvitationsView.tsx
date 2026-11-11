"use client"

import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import InvitationTable, { type InvitationTableInvitee } from "@/components/shared/InvitationTable"
import SentInvitationsList from "@/components/shared/SentInvitationsList"
import { sendInvitations, cancelInvitation } from "@/_mocks/invitations.actions"
import type { Invitation } from "@/types/invitation"
import styles from "./InvitationsView.module.css"

interface InvitationsViewProps {
    groups: { id: string; name: string }[]
    sentInvitations: Invitation[]
    userId: string
    organizationId: string
}

export default function InvitationsView({ groups, sentInvitations, userId, organizationId }: InvitationsViewProps) {
    const [invitations, setInvitations] = useState(sentInvitations)

    async function handleSubmit(invitees: InvitationTableInvitee[]) {
        const resultat = await sendInvitations(
            invitees.map((invitee) => ({
                email: invitee.email,
                roles: invitee.roles,
                organizationId,
                groupIds: invitee.groupIds,
                invitedByUserId: userId,
            }))
        )
        setInvitations((prev) => [...resultat.created, ...prev])
        return resultat.erreurs
    }

    async function handleCancel(invitationId: string) {
        await cancelInvitation(invitationId)
        setInvitations((prev) => prev.filter((invitation) => invitation.id !== invitationId))
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Invitations"
                subtitle="Invitez des apprenants dans vos groupes, en lot ou un par un."
            />

            <InvitationTable
                allowedRoles={["apprenant"]}
                availableGroups={groups}
                draftStorageKey="invitations-draft:formateur"
                onSubmit={handleSubmit}
            />

            <SentInvitationsList invitations={invitations} onCancel={handleCancel} />
        </div>
    )
}