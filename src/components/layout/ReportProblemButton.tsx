"use client"

import { useState, useEffect } from "react"
import { faFlag } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import SidePanel from "@/components/ui/SidePanel"
import Tabs from "@/components/ui/Tabs"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StatusBadge from "@/components/ui/StatusBadge"
import { createReport, addReportMessage } from "@/_mocksToMigrate/reports.actions"
import { getReportsBySubmitter } from "@/_mocksToMigrate/reports.mock"
import { formatLongDateTimeLabel, formatLongDateLabel } from "@/lib/date"
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS } from "@/types/report"
import type { ReportType, ReportStatus, Report } from "@/types/report"
import type { Role } from "@/constants/roles"
import styles from "./ReportProblemButton.module.css"

interface ReportProblemButtonProps {
    userId: string
    userName: string
    role: Role
    organizationId?: string
    organizationName?: string
}

type View = "new" | "list" | "detail"

const REPORT_TABS = [
    { id: "new", label: "Nouveau signalement" },
    { id: "list", label: "Mes signalements" },
] as const

const STATUS_VARIANT: Record<ReportStatus, "success" | "neutral"> = {
    en_attente: "neutral",
    en_cours: "neutral",
    resolu: "success",
}

/**
 * SidePanel (components/ui/), pas Modal — contenu long/parcourable
 * (plusieurs signalements, fils de discussion moyennement longs), pas
 * court/ponctuel. Même composant déjà utilisé pour le centre de
 * notifications, même raisonnement exact.
 *
 * Icône seule sur petit écran, texte visible dès 640px — même patron
 * mobile-first que Topbar.tsx.
 */
export default function ReportProblemButton({ userId, userName, role, organizationId, organizationName }: ReportProblemButtonProps) {
    const [isOpen, setOpen] = useState(false)
    const [view, setView] = useState<View>("new")
    const [myReports, setMyReports] = useState<Report[]>([])
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)

    const [title, setTitle] = useState("")
    const [type, setType] = useState<ReportType>("probleme_technique")
    const [message, setMessage] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [pendingConfirm, setPendingConfirm] = useState(false)

    const [replyText, setReplyText] = useState("")
    const [isSendingReply, setIsSendingReply] = useState(false)

    useEffect(() => {
        if (isOpen && view === "list") {
            void getReportsBySubmitter(userId).then(setMyReports)
        }
    }, [isOpen, view, userId])

    async function handleConfirmSubmit() {
        setIsSaving(true)
        await createReport({
            title,
            submittedByUserId: userId,
            submittedByName: userName,
            submittedByRole: role,
            organizationId,
            organizationName,
            type,
            message,
        })
        setIsSaving(false)
        setPendingConfirm(false)
        setSuccess(true)
        setTitle("")
        setMessage("")
    }

    async function handleSendReply() {
        if (!selectedReport || !replyText.trim()) return
        setIsSendingReply(true)
        await addReportMessage(selectedReport.id, userId, userName, replyText)
        const updated = await getReportsBySubmitter(userId)
        setMyReports(updated)
        setSelectedReport(updated.find((r) => r.id === selectedReport.id) ?? null)
        setReplyText("")
        setIsSendingReply(false)
    }

    function handleOpenReport(report: Report) {
        setSelectedReport(report)
        setView("detail")
    }

    function handleClose() {
        setOpen(false)
        setSuccess(false)
        setView("new")
        setSelectedReport(null)
    }

    return (
        <>
            <button type="button" className={styles.button} onClick={() => setOpen(true)} aria-label="Signaler un problème">
                <FontAwesomeIcon icon={faFlag} aria-hidden="true" />
                <span className={styles.label}>Signaler un problème</span>
            </button>

            <SidePanel isOpen={isOpen} onClose={handleClose} title="Signaler un problème">
                {success ? (
                    <div className={styles.successState}>
                        <p>Merci, votre signalement a été envoyé. Un administrateur le consultera bientôt.</p>
                        <Button label="Fermer" onClick={handleClose} />
                    </div>
                ) : (
                    <>
                        <Tabs
                            items={REPORT_TABS}
                            active={view === "detail" ? "list" : view}
                            onChange={(id) => setView(id as View)}
                        />

                        {view === "new" && (
                            <>
                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Résumé</span>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={styles.input}
                                        placeholder="Ex. Impossible de soumettre mes réponses"
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Type</span>
                                    <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className={styles.input}>
                                        {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Description</span>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className={styles.textarea}
                                        rows={5}
                                        placeholder="Décrivez le problème le plus précisément possible..."
                                    />
                                </label>

                                <div className={styles.formActions}>
                                    <Button
                                        label="Envoyer"
                                        onClick={() => setPendingConfirm(true)}
                                        disabled={!title.trim() || !message.trim()}
                                    />
                                </div>
                            </>
                        )}

                        {view === "list" && (
                            <div className={styles.list}>
                                {myReports.length === 0 ? (
                                    <p className={styles.empty}>Vous n&apos;avez soumis aucun signalement.</p>
                                ) : (
                                    myReports.map((report) => (
                                        <button
                                            key={report.id}
                                            type="button"
                                            className={styles.listRow}
                                            onClick={() => handleOpenReport(report)}
                                        >
                                            <div className={styles.listRowInfo}>
                                                <span className={styles.listRowTitle}>{report.title}</span>
                                                <span className={styles.listRowDate}>{formatLongDateLabel(report.createdAt)}</span>
                                            </div>
                                            <StatusBadge variant={STATUS_VARIANT[report.status]} label={REPORT_STATUS_LABELS[report.status]} />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {view === "detail" && selectedReport && (
                            <div className={styles.detail}>
                                <button type="button" className={styles.backLink} onClick={() => setView("list")}>
                                    ← Retour
                                </button>

                                <StatusBadge
                                    variant={STATUS_VARIANT[selectedReport.status]}
                                    label={REPORT_STATUS_LABELS[selectedReport.status]}
                                />

                                <div className={styles.messageList}>
                                    {selectedReport.messages.map((m) => (
                                        <div key={m.id} className={`${styles.message} ${m.isAdmin ? styles.messageAdmin : ""}`}>
                                            <div className={styles.messageHeader}>
                                                <span className={styles.messageAuthor}>{m.isAdmin ? "Administration" : m.authorName}</span>
                                                <span className={styles.messageDate}>{formatLongDateTimeLabel(m.createdAt)}</span>
                                            </div>
                                            <p className={styles.messageText}>{m.text}</p>
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
                                <Button
                                    label={isSendingReply ? "Envoi..." : "Envoyer"}
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim() || isSendingReply}
                                />
                            </div>
                        )}
                    </>
                )}
            </SidePanel>

            <ConfirmDialog
                isOpen={pendingConfirm}
                title="Envoyer ce signalement ?"
                message={`« ${title} » sera envoyé aux administrateurs de la plateforme.`}
                confirmLabel={isSaving ? "Envoi..." : "Envoyer"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmSubmit}
                onCancel={() => setPendingConfirm(false)}
            />
        </>
    )
}