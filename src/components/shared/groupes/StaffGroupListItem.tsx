import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import { routes } from "@/constants/routes"
import type { Group } from "@/types/group"
import styles from "./StaffGroupListItem.module.css"

interface StaffGroupListItemProps {
    group: Group
    memberCount: number
    pendingInvitationCount: number
    averageProgress: number
    lateCount: number
    role: "formateur" | "gestionnaire"
}

/**
 * Réservé au formateur/gestionnaire (vue "responsable" : membres,
 * invitations en attente), pas fusionné avec components/groups/GroupListItem.tsx
 * (apprenant, vue "membre" : org, contact du groupe, nombre de modules) —
 * assez différent pour justifier 2 fichiers distincts plutôt qu'un seul
 * bourré de conditions par rôle. Nommé différemment (Staff prefix) pour
 * qu'un copier-coller ne puisse plus jamais écraser l'un par l'autre,
 * comme c'est arrivé une fois déjà.
 */
export default function StaffGroupListItem({
    group,
    memberCount,
    pendingInvitationCount,
    averageProgress,
    lateCount,
    role,
}: StaffGroupListItemProps) {
    return (
        <Card href={routes[role].groupes.bySlug(group.slug)} interactive padding="md" className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.name}>{group.name}</h3>
                {lateCount > 0 && (
                    <span className={styles.lateBadge}>
                        {lateCount} en retard
                    </span>
                )}
            </div>

            <p className={styles.meta}>
                {memberCount} apprenant{memberCount > 1 ? "s" : ""}
                {pendingInvitationCount > 0 &&
                    ` · ${pendingInvitationCount} invitation${pendingInvitationCount > 1 ? "s" : ""} envoyée${pendingInvitationCount > 1 ? "s" : ""}`}
            </p>

            <div className={styles.progressRow}>
                <ProgressBar
                    value={averageProgress}
                    ariaLabel={`Progression moyenne, ${group.name}`}
                    className={styles.progressBar}
                />
                <span className={styles.progressLabel}>{averageProgress}% en moyenne</span>
            </div>
        </Card>
    )
}
