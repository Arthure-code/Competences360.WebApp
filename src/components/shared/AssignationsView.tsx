"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { faClipboardList, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import Modal from "@/components/ui/Modal"
import CollapsibleGroup from "@/components/shared/CollapsibleGroup"
import { formatLongDateLabel } from "@/lib/date"
import { getDeadlineUrgency, formatRelativeDeadlineLabel, type DeadlineUrgency } from "@/lib/deadlines"
import { deleteAssignment } from "@/_mocks/assignments.actions"
import { routes } from "@/constants/routes"
import NewAssignationModal from "../../app/formateur/_components/assignations/NewAssignationModal"
import styles from "./AssignationsView.module.css"

export interface AssignationRow {
    id: string
    /** Nécessaire pour le lien "Voir le module" dans le détail — voir routes[role].contenu.module */
    moduleId: string
    moduleTitle: string
    versionLabel: string
    /** Id du groupe ou de l'apprenant ciblé — sert à grouper fiablement (le nom affiché seul pourrait, en théorie, se répéter) */
    targetId: string
    targetLabel: string
    targetType: "apprenant" | "group"
    dueDate?: string
    assignedAt: string
    /** Nom du groupe dont cette assignation individuelle prend le dessus, pour cette personne — absent si aucun conflit (voir lib/assignmentOverrides.ts) */
    overriddenGroupName?: string
    /** Présent seulement si cette assignation cible une activité précise (épopée 5), pas le module entier — voir Assignment.targetType */
    activityTitle?: string
    /** Qui a créé cette assignation — affiché dans le détail au clic, absent des cartes de la liste (déjà assez dense) */
    assignedByName?: string
}

export interface AssignableModule {
    moduleId: string
    title: string
    officialVersionId: string | null
    versions: {
        versionId: string
        versionNumber: number
        title: string
        isOfficial: boolean
        createdAt: string
        /** Activités de CETTE version précise — sert au sélecteur "Activité précise" (épopée 5), une liste différente par version puisque le contenu peut varier d'une version à l'autre */
        niveaux: { id: string; title: string }[]
    }[]
}

interface AssignationsViewProps {
    rows: AssignationRow[]
    assignableModules: AssignableModule[]
    groups: { id: string; name: string }[]
    apprenants: { userId: string; fullName: string }[]
    userId: string
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu pour le lien "Voir le module" dans le détail */
    role: "formateur" | "gestionnaire"
}

type TargetTab = "groups" | "apprenants"
type DueDateFilter = "all" | "withDueDate" | "withoutDueDate"

const URGENCY_ORDER: Record<DeadlineUrgency, number> = { urgent: 0, soon: 1, normal: 2 }
const URGENCY_LABEL: Record<DeadlineUrgency, string> = { urgent: "Urgent", soon: "Bientôt", normal: "À venir" }

interface TargetGroup {
    targetId: string
    targetLabel: string
    rows: AssignationRow[]
    /** La pire urgence parmi les assignations de cette cible — absent si aucune n'a d'échéance */
    worstUrgency: DeadlineUrgency | null
}

/**
 * Regroupée par cible (un groupe, ou un apprenant) plutôt qu'une liste
 * plate — avec 100 assignations réparties sur 15 groupes/apprenants, on
 * voit 15 lignes repliées, pas 100. 2 tabs Groupes/Apprenants (au lieu de
 * 2 sections empilées) séparent d'entrée ce qui vient d'un groupe vs
 * d'une assignation individuelle. Pas de barre de recherche ici — celle
 * de la topbar sert déjà cet usage.
 *
 * Le filtre échéance (Toutes / Avec échéance / Sans échéance) s'applique
 * AVANT le regroupement — une cible sans aucune assignation restante
 * après filtre disparaît de la liste plutôt que d'afficher un groupe vide.
 */
export default function AssignationsView({ rows, assignableModules, groups, apprenants, userId, role }: AssignationsViewProps) {
    const router = useRouter()
    const [isModalOpen, setModalOpen] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [pendingDeleteRow, setPendingDeleteRow] = useState<AssignationRow | null>(null)
    const [detailRow, setDetailRow] = useState<AssignationRow | null>(null)
    const [activeTab, setActiveTab] = useState<TargetTab>("groups")
    const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all")

    async function handleConfirmRemove() {
        if (!pendingDeleteRow) return
        setRemovingId(pendingDeleteRow.id)
        await deleteAssignment(pendingDeleteRow.id)
        setPendingDeleteRow(null)
        router.refresh()
        setRemovingId(null)
    }

    const filteredRows = useMemo(() => {
        if (dueDateFilter === "all") return rows
        return rows.filter((row) => (dueDateFilter === "withDueDate" ? Boolean(row.dueDate) : !row.dueDate))
    }, [rows, dueDateFilter])

    const groupTargets = useMemo(() => buildTargetGroups(filteredRows, "group"), [filteredRows])
    const apprenantTargets = useMemo(() => buildTargetGroups(filteredRows, "apprenant"), [filteredRows])

    const currentTargets = activeTab === "groups" ? groupTargets : apprenantTargets

    function renderAssignationRow(row: AssignationRow) {
        const urgency = row.dueDate ? getDeadlineUrgency(row.dueDate) : null
        return (
            <button key={row.id} type="button" className={styles.row} onClick={() => setDetailRow(row)}>
                <div className={styles.rowInfo}>
                    <span className={styles.moduleTitle}>
                        {row.moduleTitle}
                        {row.activityTitle && <span className={styles.activityBadge}> — Activité : {row.activityTitle}</span>}
                    </span>
                    <span className={styles.meta}>
                        {row.versionLabel}
                        {row.dueDate && ` — ${formatRelativeDeadlineLabel(row.dueDate)} (${formatLongDateLabel(row.dueDate)})`}
                    </span>
                    {row.overriddenGroupName && (
                        <span className={styles.overrideNote}>
                            Remplace l'assignation de groupe « {row.overriddenGroupName} » pour cette personne
                        </span>
                    )}
                </div>
                {urgency && <span className={`${styles.urgencyBadge} ${styles[`urgency_${urgency}`]}`}>{URGENCY_LABEL[urgency]}</span>}
                <span
                    role="button"
                    tabIndex={0}
                    className={styles.removeButton}
                    onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteRow(row)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation()
                            setPendingDeleteRow(row)
                        }
                    }}
                    aria-label="Retirer cette assignation"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </span>
            </button>
        )
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Assignations"
                subtitle="Modules et activités assignés à vos apprenants et groupes."
                actions={<Button label="+ Nouvelle assignation" onClick={() => setModalOpen(true)} />}
            />

            {rows.length === 0 ? (
                <EmptyState
                    icon={faClipboardList}
                    title="Aucune assignation pour l'instant."
                    description="Assignez un module (ou une activité précise) à un apprenant ou un groupe pour qu'il apparaisse ici."
                />
            ) : (
                <>
                    <div className={styles.targetTabs}>
                        <button
                            type="button"
                            className={activeTab === "groups" ? styles.targetTabActive : styles.targetTab}
                            onClick={() => setActiveTab("groups")}
                        >
                            Groupes ({groupTargets.length})
                        </button>
                        <button
                            type="button"
                            className={activeTab === "apprenants" ? styles.targetTabActive : styles.targetTab}
                            onClick={() => setActiveTab("apprenants")}
                        >
                            Apprenants individuels ({apprenantTargets.length})
                        </button>
                    </div>

                    <div className={styles.dueDateFilters}>
                        <button
                            type="button"
                            className={dueDateFilter === "all" ? styles.filterPillActive : styles.filterPill}
                            onClick={() => setDueDateFilter("all")}
                        >
                            Toutes
                        </button>
                        <button
                            type="button"
                            className={dueDateFilter === "withDueDate" ? styles.filterPillActive : styles.filterPill}
                            onClick={() => setDueDateFilter("withDueDate")}
                        >
                            Avec échéance
                        </button>
                        <button
                            type="button"
                            className={dueDateFilter === "withoutDueDate" ? styles.filterPillActive : styles.filterPill}
                            onClick={() => setDueDateFilter("withoutDueDate")}
                        >
                            Sans échéance
                        </button>
                    </div>

                    {currentTargets.length === 0 ? (
                        <EmptyState
                            icon={faClipboardList}
                            title={
                                activeTab === "groups"
                                    ? "Aucune assignation de groupe ne correspond à ce filtre."
                                    : "Aucune assignation individuelle ne correspond à ce filtre."
                            }
                            bordered
                        />
                    ) : (
                        <div className={styles.targetList}>
                            {currentTargets.map((target) => (
                                <CollapsibleGroup
                                    key={target.targetId}
                                    className={styles.targetGroup}
                                    triggerClassName={styles.targetTrigger}
                                    label={
                                        `${target.targetLabel} — ${target.rows.length} assignation${target.rows.length > 1 ? "s" : ""}` +
                                        (target.worstUrgency ? ` — ${URGENCY_LABEL[target.worstUrgency]}` : "")
                                    }
                                >
                                    <div className={styles.list}>{target.rows.map(renderAssignationRow)}</div>
                                </CollapsibleGroup>
                            ))}
                        </div>
                    )}
                </>
            )}

            <NewAssignationModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                assignableModules={assignableModules}
                groups={groups}
                apprenants={apprenants}
                userId={userId}
            />

            <Modal isOpen={detailRow !== null} onClose={() => setDetailRow(null)} ariaLabel="Détail de l'assignation" maxWidth={480}>
                {detailRow && (
                    <div className={styles.detailContent}>
                        <h2 className={styles.detailTitle}>{detailRow.moduleTitle}</h2>
                        {detailRow.activityTitle && (
                            <p className={styles.detailRow}>
                                <span className={styles.detailLabel}>Activité</span>
                                {detailRow.activityTitle}
                            </p>
                        )}
                        <p className={styles.detailRow}>
                            <span className={styles.detailLabel}>Version</span>
                            {detailRow.versionLabel}
                        </p>
                        <p className={styles.detailRow}>
                            <span className={styles.detailLabel}>{detailRow.targetType === "group" ? "Groupe" : "Apprenant"}</span>
                            {detailRow.targetLabel}
                        </p>
                        <p className={styles.detailRow}>
                            <span className={styles.detailLabel}>Assignée le</span>
                            {formatLongDateLabel(detailRow.assignedAt)}
                        </p>
                        {detailRow.dueDate && (
                            <p className={styles.detailRow}>
                                <span className={styles.detailLabel}>Échéance</span>
                                {formatLongDateLabel(detailRow.dueDate)}
                            </p>
                        )}
                        {detailRow.assignedByName && (
                            <p className={styles.detailRow}>
                                <span className={styles.detailLabel}>Assignée par</span>
                                {detailRow.assignedByName}
                            </p>
                        )}
                        {detailRow.overriddenGroupName && (
                            <p className={styles.overrideNote}>
                                Remplace l'assignation de groupe « {detailRow.overriddenGroupName} » pour cette personne
                            </p>
                        )}
                        <Link href={routes[role].contenu.module(detailRow.moduleId)} className={styles.detailModuleLink}>
                            Voir le module →
                        </Link>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={pendingDeleteRow !== null}
                title="Retirer cette assignation ?"
                message={
                    pendingDeleteRow
                        ? `« ${pendingDeleteRow.moduleTitle}${pendingDeleteRow.activityTitle ? ` — ${pendingDeleteRow.activityTitle}` : ""} » ne sera plus assigné à ${pendingDeleteRow.targetType === "group" ? "ce groupe" : "cet apprenant"}. Le contenu lui-même n'est jamais touché.`
                        : ""
                }
                confirmLabel={removingId ? "Retrait..." : "Retirer"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmRemove}
                onCancel={() => setPendingDeleteRow(null)}
            />
        </div>
    )
}

function buildTargetGroups(rows: AssignationRow[], targetType: "group" | "apprenant"): TargetGroup[] {
    const byTarget = new Map<string, TargetGroup>()
    for (const row of rows) {
        if (row.targetType !== targetType) continue
        const existing = byTarget.get(row.targetId)
        const urgency = row.dueDate ? getDeadlineUrgency(row.dueDate) : null
        if (existing) {
            existing.rows.push(row)
            if (urgency && (existing.worstUrgency === null || URGENCY_ORDER[urgency] < URGENCY_ORDER[existing.worstUrgency])) {
                existing.worstUrgency = urgency
            }
        } else {
            byTarget.set(row.targetId, { targetId: row.targetId, targetLabel: row.targetLabel, rows: [row], worstUrgency: urgency })
        }
    }
    return Array.from(byTarget.values()).sort((a, b) => a.targetLabel.localeCompare(b.targetLabel))
}