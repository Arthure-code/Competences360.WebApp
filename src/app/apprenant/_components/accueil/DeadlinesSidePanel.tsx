"use client"

import SidePanel from "@/components/ui/SidePanel"
import DeadlineCard from "@/components/shared/DeadlineCard"
import type { Deadline } from "@/types/deadline"
import type { Category } from "@/types/category"

interface DeadlinesSidePanelProps {
    isOpen: boolean
    onClose: () => void
    deadlines: Deadline[]
    categories: Category[]
}

export default function DeadlinesSidePanel({ isOpen, onClose, deadlines, categories }: DeadlinesSidePanelProps) {
    return (
        <SidePanel isOpen={isOpen} onClose={onClose} title="Toutes mes échéances">
            {deadlines.map((deadline) => {
                const category = categories.find((c) => c.id === deadline.categoryId)
                return (
                    <DeadlineCard
                        key={deadline.id}
                        deadline={deadline}
                        categoryLabel={category?.label ?? ""}
                        categoryIconName={category?.iconName ?? "faTag"}
                    />
                )
            })}
        </SidePanel>
    )
}
