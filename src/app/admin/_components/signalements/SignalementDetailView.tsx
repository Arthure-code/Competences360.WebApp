"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { updateReportStatus, updateReportPriority, claimReport, addReportMessage } from "@/_mocksToMigrate/reports.actions"
import { formatLongDateTimeLabel } from "@/lib/date"
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_PRIORITY_LABELS } from "@/types/report"
import type { Report, ReportStatus, ReportPriority } from "@/types/report"
import styles from "./SignalementDetailView.module.css"

interface SignalementDetailViewProps {
    report: Report
    adminId: string
    adminName: string
}

const ROLE_LABELS: Record<string, string> = {
    apprenant: "Apprenant",
    formateur: "Formateur",
    gestionnaire: "Gestionnaire",
}

/** Couleurs de fond pour les pastilles statut/priorité — pleines, pas juste une bordure, pour qu'on comprenne immédiatement "c'est déjà réglé à cette valeur", pas "remplis ce champ". */
const STATUS_COLORS: Record<ReportStatus, { bg: string; text: string }> = {
    en_attente: { bg: "#f3f4f6", text: "#374151" },
    en_cours: { bg: "#fef3c7", text: "#92600a" },
    resolu: { bg: "#dcfce7", text: "#166534" },
}

const PRIORITY_COLORS: Record<ReportPriority, { bg: string; text: string }> = {
    urgente: { bg: "#fee2e2", text: "#dc2626" },
    normale: { bg: "#fef3c7", text: "#d97706" },
    faible: { bg: "#f3f4f6", text: "#6b7280" },
}

/**
 * Statut/priorité affichés comme de vraies PASTILLES pleines (pas des
 * <select> à l'apparence de champ vide) — même esprit que GitHub/Jira :
 * la couleur de fond communique déjà la valeur actuelle au premier coup
 * d'œil, cliquer ouvre les autres options. Confirmation obligatoire avant
 * d'envoyer une réponse — évite un envoi accidentel, le message devient
 * visible pour le signaleur dès l'envoi, pas annulable après coup.
 */
export default function SignalementDetailView({ report, adminId, adminName }: SignalementDetailViewProps) {
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [replyText, setReplyText] = useState("")
    const [isSendingReply, setIsSendingReply] = useState(false)
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false)
    const [isPriorityMenuOpen, setPriorityMenuOpen] = useState(false)
    const [pendingReplyConfirm, setPendingReplyConfirm] = useState(false)

    async function handleStatusChange(status: ReportStatus) {
        setStatusMenuOpen(false)
        setIsProcessing(true)
        await updateReportStatus(report.id, status)
        setIsProcessing(false)
        router.refresh()
    }

    async function handlePriorityChange(priority: ReportPriority) {
        setPriorityMenuOpen(false)
        setIsProcessing(true)
        await updateReportPriority(report.id, priority)
        setIsProcessing(false)
        router.refresh()
    }

    async function handleClaim() {
        setIsProcessing(true)
        await claimReport(report.id)
        setIsProcessing(false)
        router.refresh()
    }

    async function handleConfirmSendReply() {
        setIsSendingReply(true)
        await addReportMessage(report.id, adminId, adminName, replyText)
        setIsSendingReply(false)
        setReplyText("")
        setPendingReplyConfirm(false)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title={report.title}
                subtitle={`${REPORT_TYPE_LABELS[report.type]} — ${report.submittedByName} (${ROLE_LABELS[report.submittedByRole] ?? report.submittedByRole}) — ${report.organizationName ?? "Sans organisation"}`}
            />

            <Card padding="lg" className={styles.card}>
                <div className={styles.controlsRow}>
                    <div className={styles.pillField}>
                        <span className={styles.fieldLabel}>Statut</span>
                        <div className={styles.pillMenuWrapper}>
                            <button
                                type="button"
                                className={styles.pill}
                                style={{ backgroundColor: STATUS_COLORS[report.status].bg, color: STATUS_COLORS[report.status].text }}
                                onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                                disabled={isProcessing}
                            >
                                {REPORT_STATUS_LABELS[report.status]} ▾
                            </button>
                            {isStatusMenuOpen && (
                                <div className={styles.pillMenu}>
                                    {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={styles.pillMenuItem}
                                            onClick={() => handleStatusChange(value as ReportStatus)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.pillField}>
                        <span className={styles.fieldLabel}>Priorité</span>
                        <div className={styles.pillMenuWrapper}>
                            <button
                                type="button"
                                className={styles.pill}
                                style={{ backgroundColor: PRIORITY_COLORS[report.priority].bg, color: PRIORITY_COLORS[report.priority].text }}
                                onClick={() => setPriorityMenuOpen(!isPriorityMenuOpen)}
                                disabled={isProcessing}
                            >
                                {REPORT_PRIORITY_LABELS[report.priority]} ▾
                            </button>
                            {isPriorityMenuOpen && (
                                <div className={styles.pillMenu}>
                                    {Object.entries(REPORT_PRIORITY_LABELS).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={styles.pillMenuItem}
                                            onClick={() => handlePriorityChange(value as ReportPriority)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Soumis le {formatLongDateTimeLabel(report.createdAt)}</span>
                    {report.claimedByAdminName ? (
                        <span className={styles.metaLabel}>Pris en charge par {report.claimedByAdminName}</span>
                    ) : (
                        <Button label="Prendre en charge" variant="outline" onClick={handleClaim} disabled={isProcessing} />
                    )}
                </div>
            </Card>

            <Card padding="lg" className={styles.card}>
                <h2 className={styles.sectionTitle}>Discussion</h2>
                <div className={styles.messageList}>
                    {report.messages.map((message) => (
                        <div key={message.id} className={`${styles.message} ${message.isAdmin ? styles.messageAdmin : ""}`}>
                            <div className={styles.messageHeader}>
                                <span className={styles.messageAuthor}>{message.authorName}</span>
                                <span className={styles.messageDate}>{formatLongDateTimeLabel(message.createdAt)}</span>
                            </div>
                            <p className={styles.messageText}>{message.text}</p>
                        </div>
                    ))}
                </div>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Répondre</span>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={styles.textarea}
                        rows={3}
                    />
                </label>
                <Button label="Envoyer" onClick={() => setPendingReplyConfirm(true)} disabled={!replyText.trim()} />
            </Card>

            <ConfirmDialog
                isOpen={pendingReplyConfirm}
                title="Envoyer cette réponse ?"
                message="Ce message sera visible immédiatement par la personne qui a soumis le signalement."
                confirmLabel={isSendingReply ? "Envoi..." : "Envoyer"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmSendReply}
                onCancel={() => setPendingReplyConfirm(false)}
            />
        </div>
    )
}