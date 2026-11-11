import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faPen } from "@fortawesome/free-solid-svg-icons"
import type { AssignmentStatus } from "@/components/shared/AssignmentStatusBadge"
import type { Niveau } from "@/types/module"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import ProgressBar from "@/components/ui/ProgressBar"
import { routes } from "@/constants/routes"
import { getNiveauCta } from "@/lib/niveauNav"
import styles from "./NiveauRow.module.css"

const DIFFICULTY_LABELS: Record<Niveau["difficulty"], string> = {
    novice: "Novice",
    intermediaire: "Intermédiaire",
    expert: "Expert",
}

const STATUS_LABELS: Record<AssignmentStatus, string> = {
    done: "TERMINÉ",
    "in-progress": "EN COURS",
    todo: "À FAIRE",
    late: "EN RETARD",
}

interface NiveauRowProps {
    moduleSlug: string
    niveau: Niveau
}

export default function NiveauRow({ moduleSlug, niveau }: NiveauRowProps) {
    const cta = getNiveauCta(moduleSlug, niveau)
    const detailHref = routes.apprenant.modules.niveau(moduleSlug, niveau.slug)

    const icon = niveau.status === "done" ? faCheck : niveau.status === "in-progress" ? faPen : null

    return (
        <Card padding="sm" className={styles.row}>
            <div className={styles.main}>
                <span className={styles.iconCircle}>{icon ? <FontAwesomeIcon icon={icon} /> : niveau.index}</span>
                <div className={styles.text}>
                    <div className={styles.titleRow}>
                        <span className={styles.title}>{niveau.title}</span>
                        {niveau.badge && <span className={styles.badge}>{niveau.badge}</span>}
                    </div>
                    <span className={styles.subtitle}>{niveau.subtitle}</span>
                </div>
            </div>

            <div className={styles.progressGroup}>
                <ProgressBar
                    value={niveau.progressPercent}
                    ariaLabel={`Progression — ${niveau.title}`}
                    className={styles.progressBar}
                />
                <span className={styles.percent}>{niveau.progressPercent}%</span>
            </div>

            <div className={styles.metaGroup}>
                <span className={styles.difficulty}>{DIFFICULTY_LABELS[niveau.difficulty]}</span>
                <span className={styles.status}>{STATUS_LABELS[niveau.status]}</span>
            </div>

            <Button
                label={cta.label}
                href={cta.disabled ? undefined : cta.href}
                disabled={cta.disabled}
                variant={niveau.status === "in-progress" ? "primary" : "outline"}
                className={styles.ctaButton}
            />
        </Card>
    )
}