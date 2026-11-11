"use client"

import { useState } from "react"
import GroupHeaderCard from "@/components/groupes/GroupHeaderCard"
import LeaveGroupModal from "./LeaveGroupModal"
import type { Group } from "@/types/group"

interface GroupHeaderSectionProps {
    group: Group
    organizationName: string
    memberCount: number
    userId: string
}

/**
 * Wrapper client entre GroupDetailView (composant serveur) et
 * GroupHeaderCard, qui attend une fonction (onLeaveGroup) — impossible de
 * la lui fournir depuis un composant serveur, une fonction ne traverse
 * jamais la frontière serveur vers client comme prop. Gère l'état
 * d'ouverture du modal ici, pas dans GroupHeaderCard lui-même, pour le
 * garder présentational comme prévu à l'origine.
 */
export default function GroupHeaderSection({ group, organizationName, memberCount, userId }: GroupHeaderSectionProps) {
    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false)

    return (
        <>
            <GroupHeaderCard
                group={group}
                organizationName={organizationName}
                memberCount={memberCount}
                onLeaveGroup={() => setLeaveModalOpen(true)}
            />
            <LeaveGroupModal
                isOpen={isLeaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                group={group}
                userId={userId}
            />
        </>
    )
}
