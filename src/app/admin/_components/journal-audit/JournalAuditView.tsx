"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { faFilter } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatLongDateTimeLabel } from "@/lib/date"
import { highlightMatches } from "@/lib/textHighlight"
import { useAdminSearchQuery } from "@/app/admin/_components/AdminSearchContext"
import { AUDIT_ACTION_LABELS } from "@/types/auditLog"
import type { AuditLogEntry } from "@/types/auditLog"
import styles from "./JournalAuditView.module.css"

interface JournalAuditViewProps {
    entries: AuditLogEntry[]
}

type SortOrder = "none" | "newest" | "oldest"

const MONTH_LABELS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

/**
 * Consultation seule — jamais de modification/suppression d'une entrée,
 * ça viderait le journal de son sens (voir types/auditLog.ts).
 *
 * Plus de barre de recherche locale — la requête vient maintenant de la
 * topbar (voir AdminSearchContext.tsx), filtre+surligne directement cette
 * liste en tapant, peu importe la page Admin où on se trouve. Le filtre
 * de date, lui, reste local — un contrôle différent, pas un doublon de
 * recherche.
 */
export default function JournalAuditView({ entries }: JournalAuditViewProps) {
    const query = useAdminSearchQuery()
    const [isFilterOpen, setFilterOpen] = useState(false)
    const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [selectedYear, setSelectedYear] = useState<number | null>(null)

    const availableYears = useMemo(() => {
        const years = new Set(entries.map((e) => new Date(e.createdAt).getFullYear()))
        return [...years].sort((a, b) => b - a)
    }, [entries])

    const hasDateFilter = selectedMonth !== null || selectedYear !== null

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        let result = entries.filter((e) => {
            const matchesQuery =
                !normalized ||
                e.actorName.toLowerCase().includes(normalized) ||
                e.description.toLowerCase().includes(normalized) ||
                (e.targetLabel?.toLowerCase().includes(normalized) ?? false)

            const entryDate = new Date(e.createdAt)
            const matchesMonth = selectedMonth === null || entryDate.getMonth() === selectedMonth
            const matchesYear = selectedYear === null || entryDate.getFullYear() === selectedYear

            return matchesQuery && matchesMonth && matchesYear
        })

        if (sortOrder !== "none") {
            result = [...result].sort((a, b) => {
                const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                return sortOrder === "newest" ? -diff : diff
            })
        }

        return result
    }, [entries, query, sortOrder, selectedMonth, selectedYear])

    function resetFilters() {
        setSortOrder("newest")
        setSelectedMonth(null)
        setSelectedYear(null)
    }

    return (
        <div className={styles.page}>
            <PageHeader title="Journal d'audit" subtitle="Historique des actions administratives — consultation seule." />

            {query.trim() && <p className={styles.searchHint}>Filtré par « {query} » (barre de recherche)</p>}

            <div className={styles.searchRow}>
                <div className={styles.filterWrapper}>
                    <button
                        type="button"
                        className={`${styles.filterButton} ${hasDateFilter || sortOrder !== "newest" ? styles.filterButtonActive : ""}`}
                        onClick={() => setFilterOpen(!isFilterOpen)}
                    >
                        <FontAwesomeIcon icon={faFilter} aria-hidden="true" /> Filtrer par date
                    </button>
                    {isFilterOpen && (
                        <div className={styles.filterPanel}>
                            <span className={styles.filterLabel}>Tri</span>
                            <div className={styles.filterOptions}>
                                <button
                                    type="button"
                                    className={`${styles.filterOption} ${sortOrder === "newest" ? styles.filterOptionActive : ""}`}
                                    onClick={() => setSortOrder("newest")}
                                >
                                    Plus récent → plus ancien
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.filterOption} ${sortOrder === "oldest" ? styles.filterOptionActive : ""}`}
                                    onClick={() => setSortOrder("oldest")}
                                >
                                    Plus ancien → plus récent
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.filterOption} ${sortOrder === "none" ? styles.filterOptionActive : ""}`}
                                    onClick={() => setSortOrder("none")}
                                >
                                    Aucun tri
                                </button>
                            </div>

                            <span className={styles.filterLabel}>Période</span>
                            <div className={styles.filterSelects}>
                                <select
                                    className={styles.filterSelect}
                                    value={selectedMonth ?? ""}
                                    onChange={(e) => setSelectedMonth(e.target.value === "" ? null : Number(e.target.value))}
                                >
                                    <option value="">Tous les mois</option>
                                    {MONTH_LABELS.map((label, i) => (
                                        <option key={i} value={i}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={styles.filterSelect}
                                    value={selectedYear ?? ""}
                                    onChange={(e) => setSelectedYear(e.target.value === "" ? null : Number(e.target.value))}
                                >
                                    <option value="">Toutes les années</option>
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button label="Réinitialiser" variant="outline" onClick={resetFilters} />
                        </div>
                    )}
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className={styles.empty}>Aucune entrée trouvée.</p>
            ) : (
                <div className={styles.list}>
                    {filtered.map((entry) => (
                        <Card key={entry.id} padding="md" className={styles.row}>
                            <div className={styles.rowHeader}>
                                <span className={styles.rowActor}>{highlightMatches(entry.actorName, query, styles.highlight)}</span>
                                <span className={styles.rowDate}>{formatLongDateTimeLabel(entry.createdAt)}</span>
                            </div>
                            <p className={styles.rowDescription}>{highlightMatches(entry.description, query, styles.highlight)}</p>
                            {(entry.before || entry.after) && (
                                <span className={styles.rowChange}>
                                    {entry.before ?? "—"} → {entry.after ?? "—"}
                                </span>
                            )}
                            {entry.changes && entry.changes.length > 0 && (
                                <ul className={styles.changesList}>
                                    {entry.changes.map((change, i) => (
                                        <li key={i} className={styles.changesListItem}>
                                            {highlightMatches(change.label, query, styles.highlight)} :{" "}
                                            <span className={styles.rowChange}>
                                                {change.before} → {change.after}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className={styles.rowFooter}>
                                <span className={styles.rowType}>{AUDIT_ACTION_LABELS[entry.actionType]}</span>
                                {entry.targetHref && entry.targetLabel && (
                                    <Link href={entry.targetHref} className={styles.rowLink}>
                                        Consulter {entry.targetLabel} →
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}