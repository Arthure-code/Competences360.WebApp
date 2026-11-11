"use client"

import Link from "next/link"
import { faBuilding, faUserShield, faUser } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { highlightMatches } from "@/lib/textHighlight"
import type { AdminSearchResult } from "@/_mocksToMigrate/adminSearch.mock"
import styles from "./AdminSearchResults.module.css"

interface AdminSearchResultsProps {
    query: string
    results: AdminSearchResult[]
    isLoading: boolean
    onSelect: () => void
}

/**
 * Même traitement visuel que FaqAccordion.tsx (page Aide) et
 * JournalAuditView.tsx — highlightMatches (lib/textHighlight.tsx), le
 * terme tapé en gras directement dans le résultat, pas un menu déroulant
 * stylisé différemment.
 */
export default function AdminSearchResults({ query, results, isLoading, onSelect }: AdminSearchResultsProps) {
    if (!query.trim()) return null

    return (
        <div className={styles.panel}>
            {isLoading ? (
                <p className={styles.empty}>Recherche...</p>
            ) : results.length === 0 ? (
                <p className={styles.empty}>Aucune organisation, ni administrateur, ni utilisateur ne correspond à « {query} ».</p>
            ) : (
                <ul className={styles.list}>
                    {results.map((result) => (
                        <li key={`${result.type}-${result.id}`}>
                            <Link href={result.href} className={styles.row} onClick={onSelect}>
                                <FontAwesomeIcon
                                    icon={result.type === "organisation" ? faBuilding : result.type === "administrateur" ? faUserShield : faUser}
                                    className={styles.icon}
                                    aria-hidden="true"
                                />
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowLabel}>
                                        {highlightMatches(result.label, query, styles.highlight)}
                                        {result.isActive === false && <span className={styles.inactiveTag}> — Désactivé</span>}
                                    </span>
                                    <span className={styles.rowSublabel}>{result.sublabel}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}