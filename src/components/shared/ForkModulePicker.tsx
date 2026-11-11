"use client"

import { useMemo, useState } from "react"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Tabs from "@/components/ui/Tabs"
import CollapsibleGroup from "@/components/shared/CollapsibleGroup"
import CategoryTag from "@/components/shared/CategoryTag"
import VersionStatusBadge from "@/components/shared/VersionStatusBadge"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { Category } from "@/types/category"
import type { ForkableOrgVersion } from "@/lib/contentSharing"
import styles from "./ForkModulePicker.module.css"

export interface ForkSelection {
    source: "global" | "org"
    /** moduleId pour le catalogue global, versionId pour l'org (voir NewContentActions.tsx) */
    sourceId: string
}

interface ForkModulePickerProps {
    /** Contenu de base plateforme, plus l'ancien Module[] (modules.mock.ts, retiré) — voir platformTemplates.mock.ts */
    globalModules: PlatformTemplate[]
    orgVersions: ForkableOrgVersion[]
    categories: Category[]
    onSelect: (selection: ForkSelection) => void
}

type SourceTab = "official" | "shared" | "global"

/**
 * Remplace la liste plate de boutons texte — devient illisible dès qu'il
 * y a plusieurs dizaines de modules (voir NewContentActions.tsx). 3
 * onglets, même granularité que la grille principale (Contenu de l'org /
 * Partagé / catalogue global) — pas 2 onglets qui mélangeraient
 * officiel+partagé sous un même nom déjà utilisé ailleurs avec un sens
 * différent. Recherche + regroupement par catégorie (CollapsibleGroup,
 * même pattern que Parcours/Partagé), chaque module montre sa
 * description et son nombre d'activités, pas juste son titre.
 */
export default function ForkModulePicker({ globalModules, orgVersions, categories, onSelect }: ForkModulePickerProps) {
    const [sourceTab, setSourceTab] = useState<SourceTab>("official")
    const [search, setSearch] = useState("")

    const officialVersions = useMemo(() => orgVersions.filter((v) => v.isOfficial), [orgVersions])
    const sharedVersions = useMemo(() => orgVersions.filter((v) => !v.isOfficial), [orgVersions])

    const tabs = [
        { id: "official", label: `Contenu de l'org (${officialVersions.length})` },
        { id: "shared", label: `Partagé (${sharedVersions.length})` },
        { id: "global", label: `Catalogue global (${globalModules.length})` },
    ] as const

    const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

    const filteredGlobal = useMemo(() => {
        const query = search.trim().toLowerCase()
        return query ? globalModules.filter((t) => t.content.title.toLowerCase().includes(query)) : globalModules
    }, [globalModules, search])

    function filterOrgVersions(versions: ForkableOrgVersion[]) {
        const query = search.trim().toLowerCase()
        return query ? versions.filter((v) => v.version.content.title.toLowerCase().includes(query)) : versions
    }

    const currentOrgVersions = sourceTab === "official" ? officialVersions : sourceTab === "shared" ? sharedVersions : []
    const filteredOrg = useMemo(() => filterOrgVersions(currentOrgVersions), [currentOrgVersions, search])

    // Regroupe par catégorie — "Autres" pour toute catégorie non résolue plutôt que de faire disparaître silencieusement des modules.
    const globalGroups = useMemo(() => {
        const byCategory = new Map<string, PlatformTemplate[]>()
        for (const template of filteredGlobal) {
            const list = byCategory.get(template.content.categoryId) ?? []
            list.push(template)
            byCategory.set(template.content.categoryId, list)
        }
        return Array.from(byCategory.entries()).map(([categoryId, templates]) => ({
            category: categoryById.get(categoryId),
            categoryId,
            templates,
        }))
    }, [filteredGlobal, categoryById])

    const orgGroups = useMemo(() => {
        const byCategory = new Map<string, ForkableOrgVersion[]>()
        for (const entry of filteredOrg) {
            const categoryId = entry.version.content.categoryId
            const list = byCategory.get(categoryId) ?? []
            list.push(entry)
            byCategory.set(categoryId, list)
        }
        return Array.from(byCategory.entries()).map(([categoryId, versions]) => ({
            category: categoryById.get(categoryId),
            categoryId,
            versions,
        }))
    }, [filteredOrg, categoryById])

    const isEmpty = sourceTab === "global" ? filteredGlobal.length === 0 : filteredOrg.length === 0

    const emptyMessages: Record<SourceTab, string> = {
        official: "Aucun module officiel ne correspond à cette recherche.",
        shared: "Aucun module partagé ne correspond à cette recherche.",
        global: "Aucun module du catalogue global ne correspond à cette recherche.",
    }

    return (
        <div className={styles.picker}>
            <Tabs items={tabs} active={sourceTab} onChange={(id) => setSourceTab(id as SourceTab)} />

            <div className={styles.searchField}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} aria-hidden="true" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un module..."
                    className={styles.searchInput}
                />
            </div>

            {isEmpty ? (
                <p className={styles.empty}>{emptyMessages[sourceTab]}</p>
            ) : (
                <div className={styles.groupList}>
                    {sourceTab === "global"
                        ? globalGroups.map(({ category, categoryId, templates }) => (
                              <CollapsibleGroup
                                  key={categoryId}
                                  label={`${category?.label ?? "Autres"} (${templates.length})`}
                                  className={styles.group}
                                  triggerClassName={styles.groupTrigger}
                              >
                                  {templates.map((template) => (
                                      <button
                                          key={template.id}
                                          type="button"
                                          className={styles.moduleItem}
                                          onClick={() => onSelect({ source: "global", sourceId: template.id })}
                                      >
                                          <div className={styles.moduleItemHeader}>
                                              <span className={styles.moduleTitle}>{template.content.title}</span>
                                              {category && (
                                                  <CategoryTag label={category.label} color={category.color} iconName={category.iconName} />
                                              )}
                                          </div>
                                          <p className={styles.moduleDescription}>{template.content.description}</p>
                                          <span className={styles.moduleMeta}>
                                              {template.content.niveaux.length} activité
                                              {template.content.niveaux.length > 1 ? "s" : ""}
                                          </span>
                                      </button>
                                  ))}
                              </CollapsibleGroup>
                          ))
                        : orgGroups.map(({ category, categoryId, versions }) => (
                              <CollapsibleGroup
                                  key={categoryId}
                                  label={`${category?.label ?? "Autres"} (${versions.length})`}
                                  className={styles.group}
                                  triggerClassName={styles.groupTrigger}
                              >
                                  {versions.map(({ version, isOfficial, attributionLabel }) => (
                                      <button
                                          key={version.id}
                                          type="button"
                                          className={styles.moduleItem}
                                          onClick={() => onSelect({ source: "org", sourceId: version.id })}
                                      >
                                          <div className={styles.moduleItemHeader}>
                                              <span className={styles.moduleTitle}>{version.content.title}</span>
                                              <VersionStatusBadge version={version} isOfficial={isOfficial} />
                                          </div>
                                          <p className={styles.moduleDescription}>{version.content.description}</p>
                                          <div className={styles.moduleMetaRow}>
                                              <span className={styles.moduleMeta}>
                                                  {version.content.niveaux.length} activité
                                                  {version.content.niveaux.length > 1 ? "s" : ""}
                                              </span>
                                              <span className={styles.moduleMeta}>{attributionLabel}</span>
                                          </div>
                                      </button>
                                  ))}
                              </CollapsibleGroup>
                          ))}
                </div>
            )}
        </div>
    )
}