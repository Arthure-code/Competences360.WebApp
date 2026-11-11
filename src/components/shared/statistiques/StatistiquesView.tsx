"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import GroupComparisonTable, {
  type GroupSortKey,
} from "./GroupComparisonTable";
import ApprenantComparisonTable, {
  type ApprenantSortKey,
} from "./ApprenantComparisonTable";
import FormateurComparisonTable, {
  type FormateurSortKey,
} from "./FormateurComparisonTable";
import ProgressDistributionChart from "./ProgressDistributionChart";
import { telechargerExport, type ExportFormat } from "@/lib/statsExport";
import {
  computeFormateurStatsRows,
  type GroupStatsRow,
} from "@/lib/groupStats";
import { dedupliquerParApprenant } from "@/lib/formateurDashboard";
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider";
import type { ApprenantSummary } from "@/types/apprenantSummary";
import styles from "./StatistiquesView.module.css";

type SortDirection = "asc" | "desc";

interface FormateurOption {
  id: string;
  fullName: string;
}

interface ModuleOption {
  id: string;
  title: string;
}

interface StatistiquesViewProps {
  allGroupRows: GroupStatsRow[];
  allSummaries: ApprenantSummary[];
  /** Absent côté formateur, comparer par formateur n'a de sens que pour le gestionnaire (voir la discussion sur la portée des filtres) */
  formateurOptions?: FormateurOption[];
  /** Modules de l'org, pour le filtre — voir apprenantModuleUserIds pour comment il s'applique réellement aux données */
  moduleOptions?: ModuleOption[];
  /**
   * moduleId -> userIds ayant une trace de progression réelle sur ce
   * module (voir apprenantModuleProgress.mock.ts, construit côté
   * serveur par page.tsx). Rend le filtre Module réellement possible —
   * avant apprenantModuleProgress (épopée 2), rien ne reliait un
   * apprenant à un module précis de façon fiable, le filtre était
   * volontairement omis plutôt que de simuler un effet qu'il n'avait pas.
   */
  apprenantModuleUserIds?: Record<string, string[]>;
  role: "formateur" | "gestionnaire";
}

type ViewMode = "groups" | "apprenants" | "formateurs";

/** Générique, réutilisé par les 3 tris (groupe/apprenant/formateur) — string trié alphabétiquement, number/null trié en valeur, null toujours en dernier peu importe la direction. */
function compareValues(
  a: string | number | null,
  b: string | number | null,
  direction: SortDirection,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const result =
    typeof a === "string" && typeof b === "string"
      ? a.localeCompare(b)
      : (a as number) - (b as number);
  return direction === "asc" ? result : -result;
}

/**
 * Tout le calcul asynchrone (memberCount, invitations) s'est déjà fait
 * une seule fois côté serveur (voir page.tsx, computeGroupStatsRows) —
 * ici, uniquement du filtrage et du tri synchrones sur des données déjà
 * prêtes, pas de refetch à chaque changement.
 *
 * Filtres : Groupe(s), Formateur(s), et maintenant Module (voir
 * apprenantModuleUserIds) — Apprenant/Période restent omis, toujours pas
 * de vraie prise sur les données actuelles.
 */
export default function StatistiquesView({
  allGroupRows,
  allSummaries,
  formateurOptions,
  moduleOptions,
  apprenantModuleUserIds,
  role,
}: StatistiquesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("groups");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedFormateurIds, setSelectedFormateurIds] = useState<string[]>(
    [],
  );
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Le délai d'inactivité vient de la plateforme, jamais d'une constante
  // locale : le même chiffre décide de ce qui est compté et de ce que la
  // carte annonce, et il est fixé une seule fois côté serveur.
  const configuration = usePlatformConfiguration();

  const [groupSort, setGroupSort] = useState<{
    key: GroupSortKey;
    direction: SortDirection;
  }>({
    key: "averageProgress",
    direction: "desc",
  });
  const [apprenantSort, setApprenantSort] = useState<{
    key: ApprenantSortKey;
    direction: SortDirection;
  }>({
    key: "progressPercent",
    direction: "desc",
  });
  const [formateurSort, setFormateurSort] = useState<{
    key: FormateurSortKey;
    direction: SortDirection;
  }>({
    key: "averageProgress",
    direction: "desc",
  });

  function handleSortChange<K extends string>(
    current: { key: K; direction: SortDirection },
    setSort: (next: { key: K; direction: SortDirection }) => void,
    clickedKey: K,
  ) {
    if (current.key === clickedKey) {
      setSort({
        key: clickedKey,
        direction: current.direction === "desc" ? "asc" : "desc",
      });
    } else {
      setSort({ key: clickedKey, direction: "desc" });
    }
  }

  /**
   * Tous les apprenants ayant une trace de progression sur AU MOINS UN
   * des modules sélectionnés (union, pas intersection — sélectionner 2
   * modules élargit le résultat, ne le rétrécit pas, même logique que
   * les autres filtres à choix multiples de cette page). Set vide +
   * aucun module sélectionné = "aucun filtre actif", pas "personne ne
   * correspond".
   */
  const moduleMatchingUserIds = useMemo(() => {
    if (selectedModuleIds.length === 0 || !apprenantModuleUserIds) return null;
    const ids = new Set<string>();
    for (const moduleId of selectedModuleIds) {
      for (const userId of apprenantModuleUserIds[moduleId] ?? [])
        ids.add(userId);
    }
    return ids;
  }, [selectedModuleIds, apprenantModuleUserIds]);

  const filteredGroupRows = useMemo(() => {
    return allGroupRows.filter((row) => {
      const matchesGroup =
        selectedGroupIds.length === 0 ||
        selectedGroupIds.includes(row.group.id);
      const matchesFormateur =
        selectedFormateurIds.length === 0 ||
        selectedFormateurIds.includes(row.group.contact.id);
      // Un groupe correspond au filtre Module si AU MOINS UN de ses
      // apprenants (pas encore filtré par groupe/formateur ici,
      // voir allSummaries) a une trace de progression sur le module.
      const matchesModule =
        moduleMatchingUserIds === null ||
        allSummaries.some(
          (s) =>
            s.groupId === row.group.id && moduleMatchingUserIds.has(s.userId),
        );
      return matchesGroup && matchesFormateur && matchesModule;
    });
  }, [
    allGroupRows,
    allSummaries,
    selectedGroupIds,
    selectedFormateurIds,
    moduleMatchingUserIds,
  ]);

  const filteredSummaries = useMemo(() => {
    const filteredGroupIds = new Set(
      filteredGroupRows.map((row) => row.group.id),
    );
    return allSummaries.filter((summary) => {
      const matchesGroup = filteredGroupIds.has(summary.groupId);
      const matchesModule =
        moduleMatchingUserIds === null ||
        moduleMatchingUserIds.has(summary.userId);
      return matchesGroup && matchesModule;
    });
  }, [allSummaries, filteredGroupRows, moduleMatchingUserIds]);

  const sortedGroupRows = useMemo(() => {
    return [...filteredGroupRows].sort((a, b) => {
      const value = (row: GroupStatsRow) =>
        groupSort.key === "name" ? row.group.name : row[groupSort.key];
      return compareValues(value(a), value(b), groupSort.direction);
    });
  }, [filteredGroupRows, groupSort]);

  const sortedSummaries = useMemo(() => {
    return [...filteredSummaries].sort((a, b) => {
      const value = (summary: ApprenantSummary) => {
        if (apprenantSort.key === "name") return summary.fullName;
        if (apprenantSort.key === "lateCount")
          return summary.lateModuleTitles.length;
        return summary[apprenantSort.key];
      };
      return compareValues(value(a), value(b), apprenantSort.direction);
    });
  }, [filteredSummaries, apprenantSort]);

  const formateurRows = useMemo(
    () => computeFormateurStatsRows(filteredGroupRows, filteredSummaries),
    [filteredGroupRows, filteredSummaries],
  );
  const sortedFormateurRows = useMemo(() => {
    return [...formateurRows].sort((a, b) =>
      compareValues(
        a[formateurSort.key],
        b[formateurSort.key],
        formateurSort.direction,
      ),
    );
  }, [formateurRows, formateurSort]);

  const orgStats = useMemo(() => {
    // Les fiches arrivent une par adhésion : sans cette déduplication, un
    // apprenant de trois groupes compterait pour trois personnes, et son
    // score pèserait trois fois dans la moyenne.
    const apprenants = dedupliquerParApprenant(filteredSummaries);
    const apprenantCount = apprenants.length;
    const averageProgress =
      apprenantCount > 0
        ? Math.round(
            apprenants.reduce((sum, s) => sum + s.progressPercent, 0) /
              apprenantCount,
          )
        : 0;
    const lateCount = apprenants.reduce(
      (sum, s) => sum + s.lateModuleTitles.length,
      0,
    );
    const under50Count = apprenants.filter(
      (s) => s.progressPercent < 50,
    ).length;
    const inactiveCount = apprenants.filter((s) => {
      const daysSinceActive =
        (Date.now() - new Date(s.lastActiveAt).getTime()) / 86_400_000;
      return daysSinceActive > configuration.joursInactivite;
    }).length;
    const stagnantGroupCount = filteredGroupRows.filter(
      (row) => row.memberCount > 0 && row.averageProgress === 0,
    ).length;
    return {
      groupCount: filteredGroupRows.length,
      apprenantCount,
      averageProgress,
      lateCount,
      under50Count,
      inactiveCount,
      stagnantGroupCount,
    };
  }, [filteredGroupRows, filteredSummaries, configuration.joursInactivite]);

  function toggleGroupFilter(groupId: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  }

  function toggleFormateurFilter(formateurId: string) {
    setSelectedFormateurIds((prev) =>
      prev.includes(formateurId)
        ? prev.filter((id) => id !== formateurId)
        : [...prev, formateurId],
    );
  }

  function toggleModuleFilter(moduleId: string) {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  }

  /** Le tri en vigueur dépend du mode affiché, et c'est lui qui fixe le rang exporté. */
  function triCourant(): { key: string; direction: SortDirection } {
    if (viewMode === "groups") return groupSort;
    if (viewMode === "apprenants") return apprenantSort;
    return formateurSort;
  }

  /**
   * Le fichier est construit par le serveur, à partir de la vue, des filtres
   * et du tri affichés. Le navigateur ne met rien en forme : il pose la
   * question et remet le fichier reçu.
   *
   * Le `finally` garantit que les boutons redeviennent actifs même si l'appel
   * échoue : sans lui, un export raté les laisserait désactivés jusqu'au
   * rechargement de la page.
   */
  async function handleExport(format: ExportFormat) {
    const tri = triCourant();
    const parametres = new URLSearchParams({
      vue: viewMode,
      tri: tri.key,
      sens: tri.direction,
    });

    if (selectedGroupIds.length > 0)
      parametres.set("groupes", selectedGroupIds.join(","));
    if (selectedFormateurIds.length > 0)
      parametres.set("formateurs", selectedFormateurIds.join(","));
    if (selectedModuleIds.length > 0)
      parametres.set("modules", selectedModuleIds.join(","));

    setIsExporting(true);

    try {
      await telechargerExport(format, parametres);
    } finally {
      setIsExporting(false);
    }
  }

  /**
   * Le tableau du mode courant, ou l'état vide quand le filtrage ne laisse
   * aucune ligne.
   *
   * Trois questions se posent ici — quel mode est actif, reste-t-il des
   * lignes, lequel des trois tableaux afficher. Les enchaîner dans une seule
   * expression conditionnelle rendrait le rendu illisible ; des retours
   * successifs se lisent de haut en bas.
   */
  function renderTableau() {
    if (viewMode === "groups") {
      if (sortedGroupRows.length === 0) {
        return (
          <EmptyState
            icon={faChartLine}
            title="Aucun groupe ne correspond à ces filtres."
            bordered
          />
        );
      }

      return (
        <GroupComparisonTable
          rows={sortedGroupRows}
          role={role}
          sortKey={groupSort.key}
          sortDirection={groupSort.direction}
          onSortChange={(key) => handleSortChange(groupSort, setGroupSort, key)}
        />
      );
    }

    if (viewMode === "apprenants") {
      if (sortedSummaries.length === 0) {
        return (
          <EmptyState
            icon={faChartLine}
            title="Aucun apprenant ne correspond à ces filtres."
            bordered
          />
        );
      }

      return (
        <ApprenantComparisonTable
          summaries={sortedSummaries}
          role={role === "formateur" ? "formateur" : undefined}
          sortKey={apprenantSort.key}
          sortDirection={apprenantSort.direction}
          onSortChange={(key) =>
            handleSortChange(apprenantSort, setApprenantSort, key)
          }
        />
      );
    }

    if (sortedFormateurRows.length === 0) {
      return (
        <EmptyState
          icon={faChartLine}
          title="Aucun formateur ne correspond à ces filtres."
          bordered
        />
      );
    }

    return (
      <FormateurComparisonTable
        rows={sortedFormateurRows}
        sortKey={formateurSort.key}
        sortDirection={formateurSort.direction}
        onSortChange={(key) =>
          handleSortChange(formateurSort, setFormateurSort, key)
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Statistiques"
        subtitle={
          role === "gestionnaire"
            ? "Comparaison entre les groupes, les apprenants et les formateurs de l'organisation."
            : "Comparaison entre vos groupes et vos apprenants."
        }
      />

      <div className={styles.summaryGrid}>
        <button
          type="button"
          className={styles.summaryCard}
          onClick={() => setViewMode("groups")}
        >
          <span className={styles.summaryValue}>{orgStats.groupCount}</span>
          <span className={styles.summaryLabel}>
            Groupe{orgStats.groupCount > 1 ? "s" : ""}
          </span>
          {orgStats.stagnantGroupCount > 0 && (
            <span className={styles.summarySubtext}>
              {orgStats.stagnantGroupCount} sans progression
            </span>
          )}
        </button>

        <button
          type="button"
          className={styles.summaryCard}
          onClick={() => {
            setViewMode("apprenants");
            setApprenantSort({ key: "lastActiveAt", direction: "asc" });
          }}
        >
          <span className={styles.summaryValue}>{orgStats.apprenantCount}</span>
          <span className={styles.summaryLabel}>
            Apprenant{orgStats.apprenantCount > 1 ? "s" : ""}
          </span>
          {orgStats.inactiveCount > 0 && (
            <span className={styles.summarySubtext}>
              {orgStats.inactiveCount} inactif
              {orgStats.inactiveCount > 1 ? "s" : ""} depuis plus de{" "}
              {configuration.joursInactivite} jours
            </span>
          )}
        </button>

        <button
          type="button"
          className={styles.summaryCard}
          onClick={() => {
            setViewMode("apprenants");
            setApprenantSort({ key: "progressPercent", direction: "asc" });
          }}
        >
          <span className={styles.summaryValue}>
            {orgStats.averageProgress}%
          </span>
          <span className={styles.summaryLabel}>Progression moyenne</span>
          {orgStats.under50Count > 0 && (
            <span className={styles.summarySubtext}>
              {orgStats.under50Count} apprenant
              {orgStats.under50Count > 1 ? "s" : ""} sous 50%
            </span>
          )}
        </button>

        <button
          type="button"
          className={styles.summaryCard}
          onClick={() => {
            setViewMode("apprenants");
            setApprenantSort({ key: "lateCount", direction: "desc" });
          }}
        >
          <span className={styles.summaryValue}>{orgStats.lateCount}</span>
          <span className={styles.summaryLabel}>
            Module{orgStats.lateCount > 1 ? "s" : ""} en retard
          </span>
        </button>
      </div>

      <ProgressDistributionChart summaries={filteredSummaries} />

      <div className={styles.controls}>
        <div className={styles.filters}>
          <details className={styles.filterDropdown}>
            <summary>
              Groupe
              {selectedGroupIds.length > 0
                ? ` (${selectedGroupIds.length})`
                : ""}
            </summary>
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

          {formateurOptions && formateurOptions.length > 0 && (
            <details className={styles.filterDropdown}>
              <summary>
                Formateur
                {selectedFormateurIds.length > 0
                  ? ` (${selectedFormateurIds.length})`
                  : ""}
              </summary>
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

          {moduleOptions && moduleOptions.length > 0 && (
            <details className={styles.filterDropdown}>
              <summary>
                Module
                {selectedModuleIds.length > 0
                  ? ` (${selectedModuleIds.length})`
                  : ""}
              </summary>
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

          {(selectedGroupIds.length > 0 ||
            selectedFormateurIds.length > 0 ||
            selectedModuleIds.length > 0) && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={() => {
                setSelectedGroupIds([]);
                setSelectedFormateurIds([]);
                setSelectedModuleIds([]);
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className={styles.exportRow}>
          <Button
            label="Excel"
            variant="outline"
            size="sm"
            onClick={() => handleExport("excel")}
            disabled={isExporting}
          />
          <Button
            label="CSV"
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
          />
          <Button
            label="PDF"
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          />
        </div>
      </div>

      <div className={styles.viewToggle}>
        <button
          type="button"
          className={
            viewMode === "groups"
              ? styles.toggleOptionActive
              : styles.toggleOption
          }
          onClick={() => setViewMode("groups")}
        >
          Par groupe
        </button>
        <button
          type="button"
          className={
            viewMode === "apprenants"
              ? styles.toggleOptionActive
              : styles.toggleOption
          }
          onClick={() => setViewMode("apprenants")}
        >
          Par apprenant
        </button>
        {role === "gestionnaire" && (
          <button
            type="button"
            className={
              viewMode === "formateurs"
                ? styles.toggleOptionActive
                : styles.toggleOption
            }
            onClick={() => setViewMode("formateurs")}
          >
            Par formateur
          </button>
        )}
      </div>

      {renderTableau()}
    </div>
  );
}
