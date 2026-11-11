"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleCheck, faMedal, faClock, faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import type { Niveau } from "@/types/module"
import type { Notice as NoticeBlock } from "@/types/notice"
import { useNiveauProgress } from "@/hooks/useNiveauProgress"
import { formatAnswerForDisplay } from "@/lib/exerciseFeedback"
import { getExerciseDisplayTitle } from "@/lib/exerciseLabels"
import { stripNiveauPrefix } from "@/lib/legacyModules"
import { routes } from "@/constants/routes"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import Notice from "@/components/shared/Notice"
import styles from "./BilanNiveau.module.css"
import ScoringLegend from "@/components/shared/ScoringLegend"


interface BilanNiveauProps {
    moduleSlug: string
    niveau: Niveau
    notice: NoticeBlock | null
    nextNiveauHref: string | null
    backToModuleHref: string
}

function formatDuration(ms: number): string {
    const totalMinutes = Math.max(1, Math.round(ms / 60000))
    if (totalMinutes < 60) return `${totalMinutes} min`
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
}

function getScoreMessage(percent: number): string {
    if (percent >= 80) return "Excellent travail! "
    if (percent >= 50) return "Bon travail, continuez comme ça."
    return "Vous pouvez faire mieux. Essayez encore!"
}

export default function BilanNiveau({
    moduleSlug,
    niveau,
    notice,
    nextNiveauHref,
    backToModuleHref,
}: BilanNiveauProps) {
    const router = useRouter()
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const progress = useNiveauProgress({ exercises: niveau.exercises })
    const maxScore = niveau.intro.maxScore
    const scorePercent = maxScore > 0 ? (progress.totalScore / maxScore) * 100 : 0

    function handleRestart() {
        setConfirmOpen(false)
        progress.restart()
        const firstExerciseSlug = niveau.exercises[0]?.slug
        if (firstExerciseSlug) {
            router.push(routes.apprenant.modules.exercice(moduleSlug, niveau.slug, firstExerciseSlug))
        }
    }

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <div className={styles.eyebrow}>
                    <FontAwesomeIcon icon={faCircleCheck} className={styles.statusIcon} aria-hidden="true" />
                    <span>Niveau {niveau.index} complété</span>
                </div>

                <div className={styles.titleContainer}>

                    <h1 className={styles.mainTitle}>{stripNiveauPrefix(niveau.title)}</h1>
                </div>

                <div className={styles.pills}>
                    {notice && (
                        <span className={styles.pill}>
                            <FontAwesomeIcon icon={faMedal} className={styles.pillIcon} />
                            {notice.title}
                        </span>
                    )}
                    <span className={styles.pill}>
                        <FontAwesomeIcon icon={faClock} className={styles.pillIcon} />
                        Temps passé : {formatDuration(progress.elapsedMs)}
                    </span>
                </div>
            </div>

            <div className={styles.scoreCard}>
                <span className={styles.scoreLabel}>Votre résultat</span>
                <div className={styles.scoreContainer}>
                    <span className={styles.scoreObtained}>{progress.totalScore}</span>
                    <span className={styles.scoreTotal}>/ {maxScore}</span>
                </div>
                <p className={styles.scoreMessage}>{getScoreMessage(scorePercent)}</p>
            </div>

            <ScoringLegend />

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Exercice</th>
                            <th>Votre réponse</th>
                            <th>Résultat</th>
                            <th>Tentatives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {niveau.exercises.map((exercise) => {
                            const attempt = progress.getAttempt(exercise.id)
                            return (
                                <tr key={exercise.id}>
                                    <td className={styles.exerciseTitle}>{getExerciseDisplayTitle(exercise)}</td>
                                    <td className={styles.exerciseAnswer}>
                                        {attempt.lastAnswer ? formatAnswerForDisplay(exercise, attempt.lastAnswer) : "—"}
                                    </td>
                                    <td className={styles.exerciseScore}>{attempt.score ?? 0} / 1</td>
                                    <td className={styles.exerciseAttempts}>{attempt.attemptsCount}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {notice && (
                <div className={styles.achievementWrapper}>
                    <Notice notice={notice} />
                </div>
            )}

            <div className={styles.footerActions}>
                <Link href={backToModuleHref} className={styles.backLink}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Retour au module
                </Link>
                <div className={styles.ctaGroup}>
                    <Button label="Recommencer" variant="outline" onClick={() => setConfirmOpen(true)} />
                    {nextNiveauHref && <Button label="Niveau suivant" variant="primary" href={nextNiveauHref} />}
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Recommencer ce niveau ?"
                message="Vos réponses actuelles seront réinitialisées, mais votre meilleur score reste conservé."
                confirmLabel="Recommencer"
                cancelLabel="Annuler"
                onConfirm={handleRestart}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
