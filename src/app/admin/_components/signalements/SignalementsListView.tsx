"use client"

import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/ui/StatusBadge"
import { routes } from "@/constants/routes"
import { formatLongDateLabel } from "@/lib/date"
import { highlightMatches } from "@/lib/textHighlight"
import { useAdminSearchQuery } from "@/app/admin/_components/AdminSearchContext"
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS } from "@/types/report"
import type { Report, ReportStatus, ReportPriority } from "@/types/report"
import styles from "./SignalementsListView.module.css"

interface SignalementsListViewProps {
    reports: Report[]
}

const STATUS_FILTERS: { id: ReportStatus | "all"; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "en_attente", label: "En attente" },
    { id: "en_cours", label: "En cours" },
    { id: "resolu", label: "Résolu" },
]

const STATUS_VARIANT: Record<ReportStatus, "success" | "neutral"> = {
    en_attente: "neutral",
    en_cours: "neutral",
    resolu: "success",
}

const ROLE_LABELS: Record<string, string> = {
    apprenant: "Apprenant",
    formateur: "Formateur",
    gestionnaire: "Gestionnaire",
}

/** Couleur par priorité — pastille visuelle, pas juste du texte (même esprit qu'une étiquette de priorité GitHub/Jira). */
const PRIORITY_COLOR: Record<ReportPriority, string> = {
    urgente: "#dc2626",
    normale: "#d97706",
    faible: "#6b7280",
}

export default function SignalementsListView({ reports }: SignalementsListViewProps) {
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")
    const query = useAdminSearchQuery()

    const byStatus = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter)
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
        ? byStatus.filter(
              (r) =>
                  r.title.toLowerCase().includes(normalized) ||
                  r.submittedByName.toLowerCase().includes(normalized) ||
                  (r.organizationName?.toLowerCase().includes(normalized) ?? false)
          )
        : byStatus

    return (
        <div className={styles.page}>
            <PageHeader title="Signalements" subtitle="Problèmes signalés par les utilisateurs de la plateforme." />

            <div className={styles.filters}>
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className={`${styles.filterButton} ${statusFilter === f.id ? styles.filterActive : ""}`}
                        onClick={() => setStatusFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className={styles.empty}>Aucun signalement.</p>
            ) : (
                <div className={styles.list}>
                    {filtered.map((report) => {
                        const firstMessage = report.messages[0]?.text ?? ""
                        const preview = firstMessage.length > 100 ? `${firstMessage.slice(0, 100)}…` : firstMessage

                        return (
                            <Link key={report.id} href={routes.admin.signalements.bySlug(report.id)} className={styles.rowLink}>
                                <Card padding="md" className={styles.row}>
                                    <div className={styles.rowTop}>
                                        <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_COLOR[report.priority] }} />
                                        <span className={styles.typeTag}>{REPORT_TYPE_LABELS[report.type]}</span>
                                        <StatusBadge variant={STATUS_VARIANT[report.status]} label={REPORT_STATUS_LABELS[report.status]} />
                                    </div>

                                    <p className={styles.title}>{highlightMatches(report.title, query, styles.highlight)}</p>
                                    <p className={styles.preview}>{preview}</p>

                                    <div className={styles.rowMeta}>
                                        <span>
                                            {highlightMatches(report.submittedByName, query, styles.highlight)} (
                                            {ROLE_LABELS[report.submittedByRole] ?? report.submittedByRole})
                                        </span>
                                        <span>{report.organizationName ?? "Sans organisation"}</span>
                                        <span>{formatLongDateLabel(report.createdAt)}</span>
                                        {report.claimedByAdminName && <span>Pris en charge par {report.claimedByAdminName}</span>}
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}