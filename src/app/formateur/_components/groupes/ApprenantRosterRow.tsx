import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowTrendDown, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import Avatar from "@/components/ui/Avatar"
import ProgressBar from "@/components/ui/ProgressBar"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import styles from "./ApprenantRosterRow.module.css"

interface ApprenantRosterRowProps {
    summary: ApprenantSummary
    /**
     * Absent côté gestionnaire — pas encore de page de détail par
     * apprenant sous /gestionnaire (contrairement à
     * routes.formateur.apprenants.bySlug). La carte reste alors non
     * cliquable plutôt que de pointer vers une route qui n'existe pas.
     */
    href?: string
}

function formatLastActive(dateIso: string): string {
    const diffDays = Math.floor((Date.now() - new Date(dateIso).getTime()) / 86_400_000)
    if (diffDays === 0) return "Actif aujourd'hui"
    if (diffDays === 1) return "Actif hier"
    return `Inactif depuis ${diffDays} jours`
}

export default function ApprenantRosterRow({ summary, href }: ApprenantRosterRowProps) {
    const [firstName, ...rest] = summary.fullName.split(" ")
    const lastName = rest.join(" ")

    return (
        <Card href={href} interactive={Boolean(href)} padding="md" className={styles.card}>
            <Avatar firstName={firstName} lastName={lastName} avatarUrl={summary.avatarUrl} size={40} />

            <div className={styles.info}>
                <span className={styles.name}>{summary.fullName}</span>
                <span className={styles.meta}>{formatLastActive(summary.lastActiveAt)}</span>
            </div>

            <div className={styles.progressCol}>
                <ProgressBar value={summary.progressPercent} ariaLabel={`Progression — ${summary.fullName}`} />
                <span className={styles.progressLabel}>{summary.progressPercent}%</span>
            </div>

            {summary.scoreTrend !== null && (
                <span className={`${styles.trend} ${summary.scoreTrend >= 0 ? styles.trendUp : styles.trendDown}`}>
                    <FontAwesomeIcon
                        icon={summary.scoreTrend >= 0 ? faArrowTrendUp : faArrowTrendDown}
                        aria-hidden="true"
                    />
                    {Math.abs(summary.scoreTrend)}%
                </span>
            )}

            {summary.lateModuleTitles.length > 0 && (
                <span className={styles.lateBadge}>{summary.lateModuleTitles.length} en retard</span>
            )}
        </Card>
    )
}