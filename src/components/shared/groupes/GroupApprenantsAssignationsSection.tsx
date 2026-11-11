"use client"

import { useState } from "react"
import { faClipboardList, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import EmptyState from "@/components/ui/EmptyState"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import ApprenantRosterRow from "@/app/formateur/_components/groupes/ApprenantRosterRow"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import type { GroupAssignationSummary } from "@/lib/groupAssignationsSummary"
import styles from "./GroupApprenantsAssignationsSection.module.css"

interface GroupApprenantsAssignationsSectionProps {
    roster: ApprenantSummary[]
    /**
     * Une fonction ne peut jamais traverser la frontière serveur/client
     * (Next.js ne peut pas la sérialiser) — role (une simple chaîne) est
     * sérialisable, le lien se calcule ICI, côté client, pas passé tout
     * fait depuis le composant serveur appelant.
     */
    role: "formateur" | "gestionnaire"
    assignations: GroupAssignationSummary[]
}

type Tab = "apprenants" | "assignations"

/**
 * Épopée 16 — auparavant, les modules assignés à un groupe n'étaient
 * visibles nulle part depuis sa page de détail (il fallait aller les
 * chercher dans Assignations et filtrer soi-même). 2 onglets sur petit
 * écran, les deux panneaux affichés côte à côte sur un écran assez large
 * (voir la media query dans le CSS) — jamais besoin de choisir un onglet
 * quand la largeur le permet déjà.
 */
export default function GroupApprenantsAssignationsSection({
    roster,
    role,
    assignations,
}: GroupApprenantsAssignationsSectionProps) {
    const [activeTab, setActiveTab] = useState<Tab>("apprenants")

    return (
        <div className={styles.wrapper}>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={activeTab === "apprenants" ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab("apprenants")}
                >
                    Apprenants ({roster.length})
                </button>
                <button
                    type="button"
                    className={activeTab === "assignations" ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab("assignations")}
                >
                    Assignations ({assignations.length})
                </button>
            </div>

            <div className={styles.panels}>
                <div className={styles.panel} data-active={activeTab === "apprenants"}>
                    <h3 className={styles.panelTitle}>Apprenants</h3>
                    {roster.length === 0 ? (
                        <EmptyState icon={faUsers} title="Aucun apprenant dans ce groupe pour l'instant." bordered />
                    ) : (
                        <div className={styles.roster}>
                            {roster.map((summary) => (
                                <ApprenantRosterRow
                                    key={summary.userId}
                                    summary={summary}
                                    href={routes[role].apprenants.bySlug(summary.userId)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.panel} data-active={activeTab === "assignations"}>
                    <h3 className={styles.panelTitle}>Assignations</h3>
                    {assignations.length === 0 ? (
                        <EmptyState icon={faClipboardList} title="Aucun module assigné à ce groupe pour l'instant." bordered />
                    ) : (
                        <div className={styles.assignationsList}>
                            {assignations.map((assignation) => (
                                <div key={assignation.id} className={styles.assignationRow}>
                                    <span className={styles.assignationTitle}>
                                        {assignation.moduleTitle}
                                        {assignation.activityTitle && (
                                            <span className={styles.assignationActivity}> — Activité : {assignation.activityTitle}</span>
                                        )}
                                    </span>
                                    {assignation.dueDate && (
                                        <span className={styles.assignationDue}>Échéance {formatLongDateLabel(assignation.dueDate)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}