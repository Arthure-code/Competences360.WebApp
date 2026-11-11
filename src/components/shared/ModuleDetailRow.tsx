"use client"

import { useEffect, useState } from "react"
import ProgressBar from "@/components/ui/ProgressBar"
import AssignmentStatusBadge from "@/components/shared/AssignmentStatusBadge"
import { getModuleProgressSummary, formatModuleTimeSpent } from "@/lib/moduleProgress"
import type { Module } from "@/types/module"
import styles from "./ModuleDetailRow.module.css"

interface ModuleDetailRowProps {
    module: Module
}

export default function ModuleDetailRow({ module }: ModuleDetailRowProps) {
    const [summary, setSummary] = useState<{ averageScorePercent: number | null; elapsedMs: number }>({
        averageScorePercent: null,
        elapsedMs: 0,
    })

    // Asynchrone depuis que la progression vit sur l'API — `annule` écarte
    // une réponse arrivée après un changement de module ou un démontage.
    useEffect(() => {
        let annule = false

        getModuleProgressSummary(module).then((resultat) => {
            if (!annule) setSummary(resultat)
        })

        return () => {
            annule = true
        }
    }, [module])

    return (
        <div className={styles.row}>
            <span className={styles.title}>{module.title}</span>

            <div className={styles.progressCell}>
                <ProgressBar
                    value={module.progressPercent}
                    ariaLabel={`Progression — ${module.title}`}
                    className={styles.bar}
                />
                <span className={styles.progressValue}>{module.progressPercent}%</span>
            </div>

            <span className={styles.average}>
                {summary.averageScorePercent === null ? "—" : `${summary.averageScorePercent}%`}
            </span>

            <span className={styles.time}>{formatModuleTimeSpent(summary.elapsedMs)}</span>

            <AssignmentStatusBadge status={module.status} className={styles.status} />
        </div>
    )
}