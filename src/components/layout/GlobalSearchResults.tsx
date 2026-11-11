"use client"

import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBookOpen, faUserGroup, faUser, faCircleNotch } from "@fortawesome/free-solid-svg-icons"
import { highlightMatches } from "@/lib/textHighlight"
import type { SearchResult, SearchResultType } from "@/types/searchResult"
import styles from "./GlobalSearchResults.module.css"

interface GlobalSearchResultsProps {
    query: string
    results: SearchResult[]
    isLoading: boolean
    onSelect: () => void
}

const TYPE_ICONS: Record<SearchResultType, typeof faBookOpen> = {
    module: faBookOpen,
    group: faUserGroup,
    member: faUser,
}

const TYPE_LABELS: Record<SearchResultType, string> = {
    module: "Modules",
    group: "Groupes",
    member: "Membres",
}

/**
 * Regroupé par type (module/groupe/membre), pas une liste plate — plus
 * facile à parcourir quand la recherche renvoie des résultats de nature
 * différente en même temps. Rendu seulement si query non vide, sinon rien
 * (voir AppShell.tsx, qui contrôle quand ce composant apparaît).
 *
 * Le terme recherché est maintenant surligné dans chaque résultat (voir
 * highlightMatches, lib/textHighlight.tsx, réutilisée aussi par la
 * recherche du Centre d'aide) — auparavant, taper quelque chose de précis
 * ne se distinguait visuellement en rien dans la liste des résultats.
 */
export default function GlobalSearchResults({ query, results, isLoading, onSelect }: GlobalSearchResultsProps) {
    if (!query.trim()) return null

    const grouped = (["module", "group", "member"] as const)
        .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
        .filter((group) => group.items.length > 0)

    return (
        <div className={styles.panel}>
            {isLoading ? (
                <div className={styles.loading}>
                    <FontAwesomeIcon icon={faCircleNotch} spin aria-hidden="true" />
                    Recherche...
                </div>
            ) : grouped.length === 0 ? (
                <p className={styles.empty}>Aucun résultat pour « {query} ».</p>
            ) : (
                grouped.map((group) => (
                    <div key={group.type} className={styles.group}>
                        <span className={styles.groupLabel}>{TYPE_LABELS[group.type]}</span>
                        {group.items.map((item) => (
                            <Link key={item.id} href={item.href} className={styles.item} onClick={onSelect}>
                                <FontAwesomeIcon icon={TYPE_ICONS[item.type]} className={styles.itemIcon} aria-hidden="true" />
                                <div className={styles.itemText}>
                                    <span className={styles.itemLabel}>{highlightMatches(item.label, query, styles.highlight)}</span>
                                    {item.description && (
                                        <span className={styles.itemDescription}>
                                            {highlightMatches(item.description, query, styles.highlight)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ))
            )}
        </div>
    )
}