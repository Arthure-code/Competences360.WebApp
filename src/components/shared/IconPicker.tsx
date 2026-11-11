"use client"

import { useMemo, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { getAllSolidIcons, searchSolidIcons } from "@/lib/iconLibrary"
import styles from "./IconPicker.module.css"

interface IconPickerProps {
    value?: string
    onSelect: (iconName: string) => void
}

/**
 * Accès direct à TOUTE la librairie FontAwesome solid (voir
 * lib/iconLibrary.ts), pas une sélection pré-filtrée — la recherche est
 * donc essentielle ici (des milliers d'icônes, impossible à parcourir
 * sans filtrer). Grille virtuellement illimitée, mais le DOM reste léger
 * : seule la recherche réduit ce qui est affiché, pas de pagination
 * nécessaire pour l'instant vu la taille raisonnable après un filtre.
 */
export default function IconPicker({ value, onSelect }: IconPickerProps) {
    const [query, setQuery] = useState("")

    const results = useMemo(() => (query.trim() ? searchSolidIcons(query) : getAllSolidIcons().slice(0, 120)), [query])

    return (
        <div className={styles.picker}>
            <div className={styles.searchField}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} aria-hidden="true" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher une icône (ex. livre, étoile, maison)..."
                    className={styles.searchInput}
                />
            </div>

            {!query.trim() && <p className={styles.hint}>Aperçu des premières icônes — tapez pour chercher parmi toute la librairie.</p>}

            {results.length === 0 ? (
                <p className={styles.empty}>Aucune icône ne correspond à cette recherche.</p>
            ) : (
                <div className={styles.grid}>
                    {results.map((icon) => (
                        <button
                            key={icon.name}
                            type="button"
                            className={`${styles.iconButton} ${value === icon.name ? styles.iconButtonActive : ""}`}
                            onClick={() => onSelect(icon.name)}
                            title={icon.name}
                            aria-label={icon.name}
                            aria-pressed={value === icon.name}
                        >
                            <FontAwesomeIcon icon={icon.definition} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
