"use client"

import { useMemo, useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import { faChartLine } from "@fortawesome/free-solid-svg-icons"
import GroupComparisonTable, { type GroupSortKey } from "@/components/shared/statistiques/GroupComparisonTable"
import ApprenantComparisonTable, { type ApprenantSortKey } from "@/components/shared/statistiques/ApprenantComparisonTable"
import FormateurComparisonTable, { type FormateurSortKey } from "@/components/shared/statistiques/FormateurComparisonTable"
import OrganizationComparisonTable, { type OrganizationSortKey } from "./OrganizationComparisonTable"
import ProgressDistributionChart from "@/components/shared/statistiques/ProgressDistributionChart"
import { telechargerExport, type ExportFormat } from "@/lib/statsExport"
import { computeFormateurStatsRows, type GroupStatsRow } from "@/lib/groupStats"
import { dedupliquerParApprenant } from "@/lib/formateurDashboard"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import { routes } from "@/constants/routes"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import type { Organization } from "@/types/organization"
import type { OrganizationStatsRow } from "@/lib/organizationStats"
import styles from "./AdminStatistiquesView.module.css"

type SortDirection = "asc" | "desc"
type ViewMode = "organisations" | "groups" | "apprenants" | "formateurs"

interface OrgData {
    organization: Organization
    groupRows: GroupStatsRow[]
    summaries: ApprenantSummary[]
    modules: { id: string; title: string }[]
    apprenantModuleUserIds: Record<string, string[]>
}

interface AdminStatistiquesViewProps {
    organizations: Organization[]
    perOrgData: OrgData[]
    organizationStatsRows: OrganizationStatsRow[]
}

/** Même générique que StatistiquesView (le vrai, gestionnaire) — string trié alphabétiquement, number en valeur, null toujours en dernier peu importe la direction. */
function compareValues(a: string | number | null, b: string | number | null, direction: SortDirection): number {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    const result = typeof a === "string" && typeof b === "string" ? a.localeCompare(b) : (a as number) - (b as number)
    return direction === "asc" ? result : -result
}

/**
 * Reconstruction fidèle de StatistiquesView (le vrai, components/shared/
 * statistiques/, gestionnaire) — mêmes filtres (Groupe/Formateur/Module),
 * mêmes cartes résumé cliquables, même export, même bascule de vue —
 * mais à travers TOUTES les organisations plutôt qu'une seule, avec un
 * filtre Organisation en plus, et un 4e mode "Organisations" (nouveau,
 * structurellement impossible côté gestionnaire : il ne voit jamais
 * qu'une seule org, Admin peut les comparer entre elles).
 *
 * telechargerExport et usePlatformConfiguration importés directement
 * (jamais vus, jamais modifiés) — même principe que createModuleFromScratch
 * plus tôt : utilisés par leur signature connue, pas par leur contenu deviné.
 */
export default function AdminStatistiquesView({ organizations, perOrgData, organizationStatsRows }: AdminStatistiquesViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("organisations")
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
    const [selectedFormateurIds, setSelectedFormateurIds] = useState<string[]>([])
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
    const [isExporting, setIsExporting] = useState(false)

    const configuration = usePlatformConfiguration()

    const [orgSort, setOrgSort] = useState<{ key: OrganizationSortKey; direction: SortDirection }>({
        key: "averageProgress",
        direction: "desc",
    })
    const [groupSort, setGroupSort] = useState<{ key: GroupSortKey; direction: SortDirection }>({
        key: "averageProgress",
        direction: "desc",
    })
    const [apprenantSort, setApprenantSort] = useState<{ key: ApprenantSortKey; direction: SortDirection }>({
        key: "progressPercent",
        direction: "desc",
    })
    const [formateurSort, setFormateurSort] = useState<{ key: FormateurSortKey; direction: SortDirection }>({
        key: "averageProgress",
        direction: "desc",
    })

    function handleSortChange<K extends string>(
        current: { key: K; direction: SortDirection },
        setSort: (next: { key: K; direction: SortDirection }) => void,
        clickedKey: K
    ) {
        if (current.key === clickedKey) {
            setSort({ key: clickedKey, direction: current.direction === "desc" ? "asc" : "desc" })
        } else {
            setSort({ key: clickedKey, direction: "desc" })
        }
    }

    // --- Données combinées selon le filtre Organisation ---
    const activeOrgData = useMemo(() => {
        if (selectedOrgIds.length === 0) return perOrgData
        return perOrgData.filter((d) => selectedOrgIds.includes(d.organization.id))
    }, [perOrgData, selectedOrgIds])

    const allGroupRows = useMemo(() => activeOrgData.flatMap((d) => d.groupRows), [activeOrgData])
    const allSummaries = useMemo(() => activeOrgData.flatMap((d) => d.summaries), [activeOrgData])

    const formateurOptions = useMemo(() => {
        const map = new Map<string, { id: string; fullName: string }>()
        for (const row of allGroupRows) map.set(row.group.contact.id, { id: row.group.contact.id, fullName: row.group.contact.fullName })
        return Array.from(map.values())
    }, [allGroupRows])

    const moduleOptions = useMemo(() => {
        const map = new Map<string, { id: string; title: string }>()
        for (const d of activeOrgData) for (const m of d.modules) map.set(m.id, m)
        return Array.from(map.values())
    }, [activeOrgData])

    const apprenantModuleUserIds = useMemo(() => {
        const combined: Record<string, string[]> = {}
        for (const d of activeOrgData) {
            for (const [moduleId, userIds] of Object.entries(d.apprenantModuleUserIds)) {
                combined[moduleId] = [...(combined[moduleId] ?? []), ...userIds]
            }
        }
        return combined
    }, [activeOrgData])

    const moduleMatchingUserIds = useMemo(() => {
        if (selectedModuleIds.length === 0) return null
        const ids = new Set<string>()
        for (const moduleId of selectedModuleIds) {
            for (const userId of apprenantModuleUserIds[moduleId] ?? []) ids.add(userId)
        }
        return ids
    }, [selectedModuleIds, apprenantModuleUserIds])

    const filteredGroupRows = useMemo(() => {
        return allGroupRows.filter((row) => {
            const matchesGroup = selectedGroupIds.length === 0 || selectedGroupIds.includes(row.group.id)
            const matchesFormateur = selectedFormateurIds.length === 0 || selectedFormateurIds.includes(row.group.contact.id)
            const matchesModule =
                moduleMatchingUserIds === null ||
                allSummaries.some((s) => s.groupId === row.group.id && moduleMatchingUserIds.has(s.userId))
            return matchesGroup && matchesFormateur && matchesModule
        })
    }, [allGroupRows, allSummaries, selectedGroupIds, selectedFormateurIds, moduleMatchingUserIds])

    const filteredSummaries = useMemo(() => {
        const filteredGroupIds = new Set(filteredGroupRows.map((row) => row.group.id))
        return allSummaries.filter((summary) => {
            const matchesGroup = filteredGroupIds.has(summary.groupId)
            const matchesModule = moduleMatchingUserIds === null || moduleMatchingUserIds.has(summary.userId)
            return matchesGroup && matchesModule
        })
    }, [allSummaries, filteredGroupRows, moduleMatchingUserIds])

    const sortedOrgRows = useMemo(() => {
        const base = selectedOrgIds.length === 0 ? organizationStatsRows : organizationStatsRows.filter((r) => selectedOrgIds.includes(r.organization.id))
        return [...base].sort((a, b) => {
            const value = (row: OrganizationStatsRow) => (orgSort.key === "name" ? row.organization.name : row[orgSort.key])
            return compareValues(value(a), value(b), orgSort.direction)
        })
    }, [organizationStatsRows, selectedOrgIds, orgSort])

    const sortedGroupRows = useMemo(() => {
        return [...filteredGroupRows].sort((a, b) => {
            const value = (row: GroupStatsRow) => (groupSort.key === "name" ? row.group.name : row[groupSort.key])
            return compareValues(value(a), value(b), groupSort.direction)
        })
    }, [filteredGroupRows, groupSort])

    const sortedSummaries = useMemo(() => {
        return [...filteredSummaries].sort((a, b) => {
            const value = (summary: ApprenantSummary) => {
                if (apprenantSort.key === "name") return summary.fullName
                if (apprenantSort.key === "lateCount") return summary.lateModuleTitles.length
                return summary[apprenantSort.key]
            }
            return compareValues(value(a), value(b), apprenantSort.direction)
        })
    }, [filteredSummaries, apprenantSort])

    const formateurRows = useMemo(() => computeFormateurStatsRows(filteredGroupRows, filteredSummaries), [filteredGroupRows, filteredSummaries])
    const sortedFormateurRows = useMemo(() => {
        return [...formateurRows].sort((a, b) => compareValues(a[formateurSort.key], b[formateurSort.key], formateurSort.direction))
    }, [formateurRows, formateurSort])

    const platformStats = useMemo(() => {
        const apprenants = dedupliquerParApprenant(filteredSummaries)
        const apprenantCount = apprenants.length
        const averageProgress =
            apprenantCount > 0 ? Math.round(apprenants.reduce((sum, s) => sum + s.progressPercent, 0) / apprenantCount) : 0
        const lateCount = apprenants.reduce((sum, s) => sum + s.lateModuleTitles.length, 0)
        const under50Count = apprenants.filter((s) => s.progressPercent < 50).length
        const inactiveCount = apprenants.filter((s) => {
            const daysSinceActive = (Date.now() - new Date(s.lastActiveAt).getTime()) / 86_400_000
            return daysSinceActive > configuration.joursInactivite
        }).length
        const stagnantGroupCount = filteredGroupRows.filter((row) => row.memberCount > 0 && row.averageProgress === 0).length
        return {
            orgCount: selectedOrgIds.length === 0 ? organizations.length : selectedOrgIds.length,
            groupCount: filteredGroupRows.length,
            apprenantCount,
            averageProgress,
            lateCount,
            under50Count,
            inactiveCount,
            stagnantGroupCount,
        }
    }, [filteredGroupRows, filteredSummaries, configuration.joursInactivite, selectedOrgIds, organizations.length])

    function toggleOrgFilter(orgId: string) {
        setSelectedOrgIds((prev) => {
            const next = prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
            // "Par organisation" compare — avec une seule org sélectionnée, ça n'aurait qu'1 ligne, aucun sens. Bascule vers le détail de CETTE org à la place.
            if (next.length === 1 && viewMode === "organisations") setViewMode("groups")
            return next
        })
    }
    function toggleGroupFilter(groupId: string) {
        setSelectedGroupIds((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
    }
    function toggleFormateurFilter(formateurId: string) {
        setSelectedFormateurIds((prev) => (prev.includes(formateurId) ? prev.filter((id) => id !== formateurId) : [...prev, formateurId]))
    }
    function toggleModuleFilter(moduleId: string) {
        setSelectedModuleIds((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
    }

    function triCourant(): { key: string; direction: SortDirection } {
        if (viewMode === "organisations") return orgSort
        if (viewMode === "groups") return groupSort
        if (viewMode === "apprenants") return apprenantSort
        return formateurSort
    }

    async function handleExport(format: ExportFormat) {
        const tri = triCourant()
        const parametres = new URLSearchParams({ vue: viewMode, tri: tri.key, sens: tri.direction })
        if (selectedOrgIds.length > 0) parametres.set("organisations", selectedOrgIds.join(","))
        if (selectedGroupIds.length > 0) parametres.set("groupes", selectedGroupIds.join(","))
        if (selectedFormateurIds.length > 0) parametres.set("formateurs", selectedFormateurIds.join(","))
        if (selectedModuleIds.length > 0) parametres.set("modules", selectedModuleIds.join(","))

        setIsExporting(true)
        try {
            await telechargerExport(format, parametres)
        } finally {
            setIsExporting(false)
        }
    }

    function renderTableau() {
        if (viewMode === "organisations") {
            if (sortedOrgRows.length === 0) {
                return <EmptyState icon={faChartLine} title="Aucune organisation ne correspond à ces filtres." bordered />
            }
            return (
                <OrganizationComparisonTable
                    rows={sortedOrgRows}
                    sortKey={orgSort.key}
                    sortDirection={orgSort.direction}
                    onSortChange={(key) => handleSortChange(orgSort, setOrgSort, key)}
                />
            )
        }

        if (viewMode === "groups") {
            if (sortedGroupRows.length === 0) {
                return <EmptyState icon={faChartLine} title="Aucun groupe ne correspond à ces filtres." bordered />
            }
            return (
                <GroupComparisonTable
                    rows={sortedGroupRows}
                    role="gestionnaire"
                    sortKey={groupSort.key}
                    sortDirection={groupSort.direction}
                    onSortChange={(key) => handleSortChange(groupSort, setGroupSort, key)}
                    getGroupHref={(slug) => routes.admin.groupes.bySlug(slug)}
                />
            )
        }

        if (viewMode === "apprenants") {
            if (sortedSummaries.length === 0) {
                return <EmptyState icon={faChartLine} title="Aucun apprenant ne correspond à ces filtres." bordered />
            }
            return (
                <ApprenantComparisonTable
                    summaries={sortedSummaries}
                    sortKey={apprenantSort.key}
                    sortDirection={apprenantSort.direction}
                    onSortChange={(key) => handleSortChange(apprenantSort, setApprenantSort, key)}
                    getApprenantHref={(userId) => routes.admin.utilisateurs.bySlug(userId)}
                />
            )
        }

        if (sortedFormateurRows.length === 0) {
            return <EmptyState icon={faChartLine} title="Aucun formateur ne correspond à ces filtres." bordered />
        }
        return (
            <FormateurComparisonTable
                rows={sortedFormateurRows}
                sortKey={formateurSort.key}
                sortDirection={formateurSort.direction}
                onSortChange={(key) => handleSortChange(formateurSort, setFormateurSort, key)}
                getFormateurHref={(formateurId) => routes.admin.utilisateurs.bySlug(formateurId)}
            />
        )
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Statistiques"
                subtitle="La santé de la plateforme — toutes organisations confondues, ou filtrées."
            />

            <div className={styles.summaryGrid}>
                <button type="button" className={styles.summaryCard} onClick={() => setViewMode("organisations")}>
                    <span className={styles.summaryValue}>{platformStats.orgCount}</span>
                    <span className={styles.summaryLabel}>Organisation{platformStats.orgCount > 1 ? "s" : ""}</span>
                </button>

                <button type="button" className={styles.summaryCard} onClick={() => setViewMode("groups")}>
                    <span className={styles.summaryValue}>{platformStats.groupCount}</span>
                    <span className={styles.summaryLabel}>Groupe{platformStats.groupCount > 1 ? "s" : ""}</span>
                    {platformStats.stagnantGroupCount > 0 && (
                        <span className={styles.summarySubtext}>{platformStats.stagnantGroupCount} sans progression</span>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.summaryCard}
                    onClick={() => {
                        setViewMode("apprenants")
                        setApprenantSort({ key: "lastActiveAt", direction: "asc" })
                    }}
                >
                    <span className={styles.summaryValue}>{platformStats.apprenantCount}</span>
                    <span className={styles.summaryLabel}>Apprenant{platformStats.apprenantCount > 1 ? "s" : ""}</span>
                    {platformStats.inactiveCount > 0 && (
                        <span className={styles.summarySubtext}>
                            {platformStats.inactiveCount} inactif{platformStats.inactiveCount > 1 ? "s" : ""} depuis plus de{" "}
                            {configuration.joursInactivite} jours
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.summaryCard}
                    onClick={() => {
                        setViewMode("apprenants")
                        setApprenantSort({ key: "progressPercent", direction: "asc" })
                    }}
                >
                    <span className={styles.summaryValue}>{platformStats.averageProgress}%</span>
                    <span className={styles.summaryLabel}>Progression moyenne</span>
                    {platformStats.under50Count > 0 && (
                        <span className={styles.summarySubtext}>
                            {platformStats.under50Count} apprenant{platformStats.under50Count > 1 ? "s" : ""} sous 50%
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.summaryCard}
                    onClick={() => {
                        setViewMode("apprenants")
                        setApprenantSort({ key: "lateCount", direction: "desc" })
                    }}
                >
                    <span className={styles.summaryValue}>{platformStats.lateCount}</span>
                    <span className={styles.summaryLabel}>Module{platformStats.lateCount > 1 ? "s" : ""} en retard</span>
                </button>
            </div>

            <ProgressDistributionChart summaries={filteredSummaries} />

            <div className={styles.controls}>
                <div className={styles.filters}>
                    <details className={styles.filterDropdown}>
                        <summary>
                            Organisation : {selectedOrgIds.length > 0 ? `${selectedOrgIds.length} sélectionnée${selectedOrgIds.length > 1 ? "s" : ""}` : `Toutes (${organizations.length})`}
                        </summary>
                        <div className={styles.filterOptions}>
                            <button
                                type="button"
                                className={styles.filterSelectAll}
                                onClick={() => setSelectedOrgIds([])}
                                disabled={selectedOrgIds.length === 0}
                            >
                                Tous ({organizations.length})
                            </button>
                            {organizations.map((org) => (
                                <label key={org.id} className={styles.filterOption}>
                                    <input type="checkbox" checked={selectedOrgIds.includes(org.id)} onChange={() => toggleOrgFilter(org.id)} />
                                    {org.name}
                                </label>
                            ))}
                        </div>
                    </details>

                    <details className={styles.filterDropdown}>
                        <summary>Groupe{selectedGroupIds.length > 0 ? ` (${selectedGroupIds.length})` : ""}</summary>
                        <div className={styles.filterOptions}>
                            {allGroupRows.map((row) => (
                                <label key={row.group.id} className={styles.filterOption}>
                                    <input
                                        type="checkbox"
                                        checked={selectedGroupIds.includes(row.group.id)}
                                        onChange={() => toggleGroupFilter(row.group.id)}
                                    />
                                    {row.group.name}
                                </label>
                            ))}
                        </div>
                    </details>

                    {formateurOptions.length > 0 && (
                        <details className={styles.filterDropdown}>
                            <summary>Formateur{selectedFormateurIds.length > 0 ? ` (${selectedFormateurIds.length})` : ""}</summary>
                            <div className={styles.filterOptions}>
                                {formateurOptions.map((formateur) => (
                                    <label key={formateur.id} className={styles.filterOption}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFormateurIds.includes(formateur.id)}
                                            onChange={() => toggleFormateurFilter(formateur.id)}
                                        />
                                        {formateur.fullName}
                                    </label>
                                ))}
                            </div>
                        </details>
                    )}

                    {moduleOptions.length > 0 && (
                        <details className={styles.filterDropdown}>
                            <summary>Module{selectedModuleIds.length > 0 ? ` (${selectedModuleIds.length})` : ""}</summary>
                            <div className={styles.filterOptions}>
                                {moduleOptions.map((module) => (
                                    <label key={module.id} className={styles.filterOption}>
                                        <input
                                            type="checkbox"
                                            checked={selectedModuleIds.includes(module.id)}
                                            onChange={() => toggleModuleFilter(module.id)}
                                        />
                                        {module.title}
                                    </label>
                                ))}
                            </div>
                        </details>
                    )}

                    {(selectedOrgIds.length > 0 || selectedGroupIds.length > 0 || selectedFormateurIds.length > 0 || selectedModuleIds.length > 0) && (
                        <button
                            type="button"
                            className={styles.clearFilters}
                            onClick={() => {
                                setSelectedOrgIds([])
                                setSelectedGroupIds([])
                                setSelectedFormateurIds([])
                                setSelectedModuleIds([])
                            }}
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>

                <div className={styles.exportRow}>
                    <Button label="Excel" variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={isExporting} />
                    <Button label="CSV" variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={isExporting} />
                    <Button label="PDF" variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={isExporting} />
                </div>
            </div>

            <div className={styles.viewToggle}>
                <button
                    type="button"
                    className={viewMode === "organisations" ? styles.toggleOptionActive : styles.toggleOption}
                    onClick={() => setViewMode("organisations")}
                    disabled={selectedOrgIds.length === 1}
                    title={selectedOrgIds.length === 1 ? "Sans intérêt avec une seule organisation sélectionnée — comparerait une chose à elle-même." : undefined}
                >
                    Par organisation
                </button>
                <button
                    type="button"
                    className={viewMode === "groups" ? styles.toggleOptionActive : styles.toggleOption}
                    onClick={() => setViewMode("groups")}
                >
                    Par groupe
                </button>
                <button
                    type="button"
                    className={viewMode === "apprenants" ? styles.toggleOptionActive : styles.toggleOption}
                    onClick={() => setViewMode("apprenants")}
                >
                    Par apprenant
                </button>
                <button
                    type="button"
                    className={viewMode === "formateurs" ? styles.toggleOptionActive : styles.toggleOption}
                    onClick={() => setViewMode("formateurs")}
                >
                    Par formateur
                </button>
            </div>

            {renderTableau()}
        </div>
    )
}