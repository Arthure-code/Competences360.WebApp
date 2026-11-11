"use client"

import { useRouter } from "next/navigation"
import SentInvitationsList from "@/components/shared/SentInvitationsList"
import { cancelInvitation } from "@/_mocks/invitations.actions"
import type { Invitation } from "@/types/invitation"

interface GroupInvitationsSectionProps {
    invitations: Invitation[]
}

/** Réutilise SentInvitationsList tel quel (déjà générique) — juste le rafraîchissement après annulation qui est propre à ce contexte. */
export default function GroupInvitationsSection({ invitations }: GroupInvitationsSectionProps) {
    const router = useRouter()

    async function handleCancel(invitationId: string) {
        await cancelInvitation(invitationId)
        router.refresh()
    }

    return <SentInvitationsList invitations={invitations} onCancel={handleCancel} />
}
