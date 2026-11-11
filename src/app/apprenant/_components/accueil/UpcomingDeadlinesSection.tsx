"use client"

import { useState } from "react"
import Link from "next/link"
import { faListCheck } from "@fortawesome/free-solid-svg-icons"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import EmptyState from "@/components/ui/EmptyState"
import DeadlinesSidePanel from "./DeadlinesSidePanel"
import { formatRelativeDeadlineLabel } from "@/lib/deadlines"
import type { Deadline } from "@/types/deadline"
import type { Category } from "@/types/category"
import styles from "./UpcomingDeadlinesSection.module.css"

interface UpcomingDeadlinesSectionProps {
    deadlines: Deadline[]
    categories: Category[]
    maxVisible?: number
}

export default function UpcomingDeadlinesSection({
    deadlines,
    categories,
    maxVisible = 3,
}: UpcomingDeadlinesSectionProps) {
    const [isPanelOpen, setPanelOpen] = useState(false)
    const visibleDeadlines = deadlines.slice(0, maxVisible)

    return (
        <>
            <CollapsibleSection
                title="Échéances à venir"
                actionLabel="Voir tout"
                onAction={() => setPanelOpen(true)}
            >
                {deadlines.length > 0 ? (
                    <ul className={styles.list}>
                        {visibleDeadlines.map((deadline) => (
                            <li key={deadline.id}>
                                <Link href={deadline.href} className={styles.item}>
                                    <span className={styles.label}>{deadline.moduleTitle}</span>
                                    <span className={styles.time}>{formatRelativeDeadlineLabel(deadline.dueDate)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState icon={faListCheck} title="Vous n'avez pas encore d'échéances." bordered />
                )}
            </CollapsibleSection>

            <DeadlinesSidePanel
                isOpen={isPanelOpen}
                onClose={() => setPanelOpen(false)}
                deadlines={deadlines}
                categories={categories}
            />
        </>
    )
}