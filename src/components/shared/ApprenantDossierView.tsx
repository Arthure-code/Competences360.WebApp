import PageHeader from "@/components/ui/PageHeader"
import Breadcrumb from "@/components/ui/Breadcrumb"
import StatGrid from "@/components/ui/StatGrid"
import Avatar from "@/components/ui/Avatar"
import Card from "@/components/ui/Card"
import RadialProgress from "@/components/shared/RadialProgress"
import CategoryTag from "@/components/shared/CategoryTag"
import CollapsibleGroup from "@/components/shared/CollapsibleGroup"
import MomentFortTimeline from "@/app/apprenant/_components/reussites/MomentFortTimeline"
import { formatLongDateLabel, formatLongDateTimeLabel } from "@/lib/date"
import { formatModuleTimeSpent } from "@/lib/moduleProgress"
import type { ApprenantDossierStats } from "@/lib/apprenantDossier"
import type { Category } from "@/types/category"
import styles from "./ApprenantDossierView.module.css"

interface ApprenantDossierViewProps {
    fullName: string
    avatarUrl?: string
    groupName: string
    breadcrumbItems: { label: string; href?: string }[]
    dossier: ApprenantDossierStats
    categories: Category[]
    /** Voir ApprenantSummary.scoreTrend — existait déjà, jamais affiché dans le dossier avant */
    scoreTrend: number | null
}

const MODULE_STATUS_LABEL: Record<"complete" | "late" | "in-progress" | "todo", string> = {
    complete: "Complété",
    late: "En retard",
    "in-progress": "En cours",
    todo: "À faire",
}

const NIVEAU_STATUS_LABEL: Record<"done" | "in-progress" | "todo", string> = {
    done: "Réussi",
    "in-progress": "En cours",
    todo: "À faire",
}

const DIFFICULTY_LABEL: Record<"novice" | "intermediaire" | "expert", string> = {
    novice: "Novice",
    intermediaire: "Intermédiaire",
    expert: "Expert",
}

/**
 * Épopée 17 — dossier complet apprenant, partagé entre la page formateur
 * et la page gestionnaire. Chaque module se déploie (CollapsibleGroup,
 * même mécanique que Parcours/Contenu ailleurs dans l'app) pour révéler
 * ses activités et leurs infos — statut, score, nombre de reprises —
 * plutôt qu'une liste plate séparée de toutes les activités. Voir
 * lib/apprenantDossier.ts pour le calcul.
 */
export default function ApprenantDossierView({
    fullName,
    avatarUrl,
    groupName,
    breadcrumbItems,
    dossier,
    categories,
    scoreTrend,
}: ApprenantDossierViewProps) {
    const [firstName, ...rest] = fullName.split(" ")
    const lastName = rest.join(" ")
    const categoryById = new Map(categories.map((c) => [c.id, c]))

    const statsItems = [
        {
            id: "trend",
            label: "Tendance de score",
            value: scoreTrend !== null ? `${scoreTrend > 0 ? "+" : ""}${scoreTrend}%` : "—",
            icon: scoreTrend !== null && scoreTrend < 0 ? "faArrowTrendDown" : "faArrowTrendUp",
        },
        {
            id: "time",
            label: "Temps total",
            value: formatModuleTimeSpent(dossier.totalTimeSpentMs),
            icon: "faClock",
        },
        { id: "attempts", label: "Tentatives totales", value: dossier.totalAttempts, icon: "faRotate" },
        {
            id: "best",
            label: "Meilleure activité",
            value: dossier.bestNiveau ? `${dossier.bestNiveau.scorePercent}%` : "—",
            icon: "faStar",
        },
        {
            id: "worst",
            label: "Activité la plus faible",
            value: dossier.worstNiveau ? `${dossier.worstNiveau.scorePercent}%` : "—",
            icon: "faTriangleExclamation",
        },
    ]

    function moduleStatus(module: ApprenantDossierStats["modules"][number]): "complete" | "late" | "in-progress" | "todo" {
        if (module.isModuleComplete) return "complete"
        if (module.isLate) return "late"
        if (module.niveauxCompleted > 0) return "in-progress"
        return "todo"
    }

    return (
        <div className={styles.page}>
            <Breadcrumb items={[...breadcrumbItems, { label: fullName }]} />

            <div className={styles.header}>
                <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size={64} />
                <PageHeader title={fullName} subtitle={groupName} />
            </div>

            {dossier.resumePoint && (
                <Card padding="md" className={styles.resumeCard}>
                    <span className={styles.resumeLabel}>En cours</span>
                    <span className={styles.resumeText}>
                        {fullName.split(" ")[0]} s'est arrêté à <strong>{dossier.resumePoint.niveauTitle}</strong> (
                        {dossier.resumePoint.moduleTitle}) — dernière activité le{" "}
                        {formatLongDateTimeLabel(dossier.resumePoint.lastActivityAt)}
                    </span>
                </Card>
            )}

            <div className={styles.overviewSection}>
                <Card padding="lg" className={styles.overviewCard}>
                    <div className={styles.overviewText}>
                        <p className={styles.overviewTitle}>Progression globale</p>
                        <p className={styles.overviewCaption}>
                            {dossier.modulesCompletedCount} module{dossier.modulesCompletedCount > 1 ? "s" : ""} complété
                            {dossier.modulesCompletedCount > 1 ? "s" : ""} sur {dossier.modules.length}
                        </p>
                    </div>
                    <div className={styles.overviewRadial}>
                        <RadialProgress
                            value={dossier.globalCompletionPercent}
                            ariaLabel={`${dossier.globalCompletionPercent}% de progression globale`}
                        />
                    </div>
                </Card>

                <div className={styles.countGrid}>
                    <div className={styles.countCard}>
                        <span className={styles.countValue}>{dossier.modulesCompletedCount}</span>
                        <span className={styles.countLabel}>Complétés</span>
                    </div>
                    <div className={styles.countCard}>
                        <span className={styles.countValue}>{dossier.modulesInProgressCount}</span>
                        <span className={styles.countLabel}>En cours</span>
                    </div>
                    <div className={`${styles.countCard} ${dossier.modulesLateCount > 0 ? styles.countCardLate : ""}`}>
                        <span className={styles.countValue}>{dossier.modulesLateCount}</span>
                        <span className={styles.countLabel}>En retard</span>
                    </div>
                    <div className={styles.countCard}>
                        <span className={styles.countValue}>{dossier.modulesTodoCount}</span>
                        <span className={styles.countLabel}>À faire</span>
                    </div>
                </div>
            </div>

            <StatGrid items={statsItems} columns={5} />

            <div className={styles.modulesSection}>
                <h2 className={styles.sectionTitle}>Détail par module</h2>
                <p className={styles.sectionHint}>Cliquez sur un module pour voir le détail de ses activités.</p>
                {dossier.modules.length === 0 ? (
                    <p className={styles.emptyText}>Aucun module assigné pour l'instant.</p>
                ) : (
                    <Card padding="none">
                        {dossier.modules.map((module) => {
                            const status = moduleStatus(module)
                            const category = categoryById.get(module.categoryId)
                            const progressSummary = `${module.niveauxCompleted}/${module.niveauxTotal} activités${
                                module.averageScorePercent !== null ? ` — ${module.averageScorePercent}% en moyenne` : ""
                            }${module.timeSpentMs > 0 ? ` — ${formatModuleTimeSpent(module.timeSpentMs)}` : ""} — ${MODULE_STATUS_LABEL[status]}`
                            return (
                                <CollapsibleGroup
                                    key={module.moduleId}
                                    label={`${module.moduleTitle} (${progressSummary})`}
                                    className={styles.moduleGroup}
                                    triggerClassName={`${styles.moduleTrigger} ${styles[`status_${status}`]}`}
                                >
                                    {category && (
                                        <div className={styles.moduleCategoryRow}>
                                            <CategoryTag label={category.label} color={category.color} iconName={category.iconName} />
                                        </div>
                                    )}
                                    <div className={styles.niveauList}>
                                        {module.niveaux.map((niveau) => (
                                            <div key={niveau.niveauId} className={styles.niveauRow}>
                                                <div className={styles.niveauMainRow}>
                                                    <div className={styles.niveauInfo}>
                                                        <span className={styles.niveauTitle}>{niveau.niveauTitle}</span>
                                                        <span className={styles.niveauMeta}>
                                                            {DIFFICULTY_LABEL[niveau.difficulty]}
                                                            {niveau.timeSpentMs > 0 && ` — ${formatModuleTimeSpent(niveau.timeSpentMs)}`}
                                                            {niveau.attemptsCount > 1 && ` — repris ${niveau.attemptsCount} fois`}
                                                        </span>
                                                    </div>
                                                    <span className={styles.niveauScore}>
                                                        {niveau.bestScore !== null
                                                            ? `${niveau.bestScore}/${niveau.maxScore} (${niveau.scorePercent}%)`
                                                            : "—"}
                                                    </span>
                                                    <span
                                                        className={`${styles.niveauStatus} ${styles[`niveauStatus_${niveau.status}`]}`}
                                                    >
                                                        {NIVEAU_STATUS_LABEL[niveau.status]}
                                                    </span>
                                                </div>

                                                {niveau.recentAttempts.length > 0 && (
                                                    <div className={styles.niveauAttemptsHistory}>
                                                        <span className={styles.niveauAttemptsLabel}>
                                                            Historique des tentatives
                                                        </span>
                                                        {niveau.recentAttempts.map((attempt) => (
                                                            <div key={attempt.id} className={styles.niveauAttemptEntry}>
                                                                <span className={styles.niveauAttemptNumber}>
                                                                    Tentative n°{attempt.attemptNumber}
                                                                </span>
                                                                <span className={styles.niveauAttemptScore}>
                                                                    {attempt.score}/{attempt.maxScore}
                                                                </span>
                                                                <span className={styles.niveauAttemptDate}>
                                                                    {formatLongDateTimeLabel(attempt.completedAt)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleGroup>
                            )
                        })}
                    </Card>
                )}
            </div>

            {(dossier.moduleTiers.best.length > 0 || dossier.moduleTiers.average.length > 0 || dossier.moduleTiers.weak.length > 0) && (
                <div className={styles.tiersSection}>
                    <h2 className={styles.sectionTitle}>Modules par niveau de performance</h2>
                    <div className={styles.tiersGrid}>
                        <div className={styles.tierColumn}>
                            <span className={`${styles.tierLabel} ${styles.tierLabelBest}`}>Meilleures (80%+)</span>
                            {dossier.moduleTiers.best.length === 0 ? (
                                <p className={styles.emptyText}>Aucun pour l'instant.</p>
                            ) : (
                                dossier.moduleTiers.best.map((m) => (
                                    <span key={m.moduleId} className={styles.tierItem}>
                                        {m.moduleTitle} — {m.averageScorePercent}%
                                    </span>
                                ))
                            )}
                        </div>
                        <div className={styles.tierColumn}>
                            <span className={`${styles.tierLabel} ${styles.tierLabelAverage}`}>Moyennes (50-79%)</span>
                            {dossier.moduleTiers.average.length === 0 ? (
                                <p className={styles.emptyText}>Aucun pour l'instant.</p>
                            ) : (
                                dossier.moduleTiers.average.map((m) => (
                                    <span key={m.moduleId} className={styles.tierItem}>
                                        {m.moduleTitle} — {m.averageScorePercent}%
                                    </span>
                                ))
                            )}
                        </div>
                        <div className={styles.tierColumn}>
                            <span className={`${styles.tierLabel} ${styles.tierLabelWeak}`}>Basses (moins de 50%)</span>
                            {dossier.moduleTiers.weak.length === 0 ? (
                                <p className={styles.emptyText}>Aucun pour l'instant.</p>
                            ) : (
                                dossier.moduleTiers.weak.map((m) => (
                                    <span key={m.moduleId} className={styles.tierItem}>
                                        {m.moduleTitle} — {m.averageScorePercent}%
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {dossier.weakSpots.length > 0 && (
                <div className={styles.weakSpotsSection}>
                    <h2 className={styles.sectionTitle}>Endroits de faiblesse</h2>
                    <p className={styles.sectionHint}>
                        Toutes les activités sous le seuil de réussite (60%) — pas seulement la plus faible.
                    </p>
                    <div className={styles.weakSpotsList}>
                        {dossier.weakSpots.map((spot, index) => (
                            <div key={index} className={styles.weakSpotRow}>
                                <div className={styles.weakSpotInfo}>
                                    <span className={styles.weakSpotTitle}>{spot.niveauTitle}</span>
                                    <span className={styles.weakSpotModule}>{spot.moduleTitle}</span>
                                </div>
                                <span className={styles.weakSpotScore}>{spot.scorePercent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dossier.recentAttempts.length > 0 && (
                <div className={styles.attemptsSection}>
                    <h2 className={styles.sectionTitle}>Tentatives récentes</h2>
                    <p className={styles.sectionHint}>
                        Vue d'ensemble des {dossier.recentAttempts.length} dernières reprises, tous modules confondus —
                        le détail par activité est aussi disponible en dépliant chaque module ci-dessus.
                    </p>
                    <div className={styles.attemptsList}>
                        {dossier.recentAttempts.map((attempt) => (
                            <Card key={attempt.id} padding="sm" className={styles.attemptRow}>
                                <div className={styles.attemptInfo}>
                                    <span className={styles.attemptTitle}>{attempt.niveauTitle}</span>
                                    <span className={styles.attemptModule}>{attempt.moduleTitle}</span>
                                </div>
                                <span className={styles.attemptScore}>
                                    {attempt.score}/{attempt.maxScore}
                                </span>
                                <span className={styles.attemptMeta}>
                                    Tentative n°{attempt.attemptNumber} — {formatLongDateLabel(attempt.completedAt)}
                                </span>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {dossier.momentsForts.length > 0 && (
                <div className={styles.momentsSection}>
                    <h2 className={styles.sectionTitle}>Moments forts</h2>
                    <MomentFortTimeline items={dossier.momentsForts} />
                </div>
            )}
        </div>
    )
}