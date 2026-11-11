"use client"

import { useRouter } from "next/navigation"
import EditableField from "@/components/shared/EditableField"
import { updateGroupName } from "@/_mocks/groups.actions"

interface EditableGroupNameProps {
    groupId: string
    name: string
}

export default function EditableGroupName({ groupId, name }: EditableGroupNameProps) {
    const router = useRouter()

    async function handleSave(value: string) {
        const trimmed = value.trim()
        if (!trimmed) return
        await updateGroupName(groupId, trimmed)
        router.refresh()
    }

    return <EditableField label="Nom du groupe" value={name} onSave={handleSave} />
}
