"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import styles from "./ProgressDistributionChart.module.css"

interface ProgressDistributionChartProps {
    summaries: ApprenantSummary[]
}

interface BracketDef {
    label: string
    min: number
    max: number
}

const BRACKETS: BracketDef[] = [
    { label: "0-24%", min: 0, max: 25 },
    { label: "25-49%", min: 25, max: 50 },
    { label: "50-74%", min: 50, max: 75 },
    { label: "75-100%", min: 75, max: 101 },
]

/**

 *
 * Reste toujours affiché, même sans apprenant correspondant (ex. filtre
 * Module trop restrictif) — les 4 barres tombent simplement à 0, plutôt
 * que de faire disparaître toute la carte (auparavant : `if
 * (summaries.length === 0) return null`, qui cachait le titre et le
 * cadre en plus des barres, déroutant après avoir filtré).
 */
export default function ProgressDistributionChart({ summaries }: ProgressDistributionChartProps) {
    const data = BRACKETS.map((bracket) => ({
        label: bracket.label,
        count: summaries.filter((s) => s.progressPercent >= bracket.min && s.progressPercent < bracket.max).length,
    }))

    return (
        <div className={styles.chartCard}>
            <h3 className={styles.title}>Répartition de la progression</h3>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                            formatter={(value: number) => [`${value} apprenant${value > 1 ? "s" : ""}`, "Nombre"]}
                            contentStyle={{
                                backgroundColor: "var(--color-bg-card)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                fontSize: "var(--font-size-sm)",
                            }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}