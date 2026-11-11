import CollapsibleSection from "@/components/ui/CollapsibleSection"
import { routes } from "@/constants/routes"
import StaffGroupListItem from "@/components/shared/groupes/StaffGroupListItem"
import type { Group } from "@/types/group"
import styles from "./GroupsPreviewSection.module.css"

interface GroupPreviewRow {
    group: Group
    memberCount: number
    pendingInvitationCount: number
    averageProgress: number
    lateCount: number
}

interface GroupsPreviewSectionProps {
    rows: GroupPreviewRow[]
    totalGroupCount: number
    /** Choisit routes.formateur.groupes ou routes.gestionnaire.groupes, sinon un gestionnaire atterrissait sur les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
}

export default function GroupsPreviewSection({ rows, totalGroupCount, role }: GroupsPreviewSectionProps) {
    return (
        <CollapsibleSection
            title={role === "formateur" ? "Mes groupes" : "Groupes de l'organisation"}
            subtitle={`${totalGroupCount} groupe${totalGroupCount > 1 ? "s" : ""} au total`}
            actionLabel="Voir tout"
            actionHref={routes[role].groupes.root}
        >
            <div className={styles.list}>
                {rows.map(({ group, memberCount, pendingInvitationCount, averageProgress, lateCount }) => (
                    <StaffGroupListItem
                        key={group.id}
                        group={group}
                        memberCount={memberCount}
                        pendingInvitationCount={pendingInvitationCount}
                        averageProgress={averageProgress}
                        lateCount={lateCount}
                        role={role}
                    />
                ))}
            </div>
        </CollapsibleSection>
    )
}