"use client"

import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./SearchInput.module.css"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    ariaLabel?: string
    /** Permet d'ajuster largeur / marges selon le contexte (hero, dashboard, etc.) */
    className?: string
}

export default function SearchInput({
    value,
    onChange,
    placeholder = "Rechercher...",
    ariaLabel = "Rechercher",
    className = "",
}: SearchInputProps) {
    return (
        <div className={`${styles.searchWrapper} ${className}`}>
            <input
                type="text"
                className={styles.searchInput}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={ariaLabel}
            />

            {value && (
                <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => onChange("")}
                    aria-label="Effacer la recherche"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            )}

            <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={styles.searchIcon}
                aria-hidden="true"
            />
        </div>
    )
}
