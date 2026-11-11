import * as solidIcons from "@fortawesome/free-solid-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

/**
 * Contrairement à icon-registry.ts (une sélection curée, réutilisée pour
 * les icônes déjà choisies ailleurs dans l'app — catégories globales,
 * statistiques, etc.), ce fichier expose TOUTE la librairie FontAwesome
 * solid — pour le sélecteur d'icône des catégories org-scopées, qui doit
 * donner un vrai accès libre, pas une liste pré-filtrée.
 *
 * @fortawesome/free-solid-svg-icons exporte chaque icône nommée
 * (faHouse, faBookOpen, ...) PLUS quelques exports qui ne sont pas des
 * icônes (fas, prefix, faFreeSolidSvgIcons). Filtré par la présence de
 * `iconName` (propriété réelle d'une IconDefinition), pas par une liste
 * de noms à maintenir à la main.
 */
export interface IconEntry {
    /** Nom d'import exact (ex. "faBookOpen") — même format que Category.iconName partout ailleurs dans l'app, résolu par resolveIcon (icon-registry.ts) */
    name: string
    definition: IconDefinition
}

const ALL_SOLID_ICONS: IconEntry[] = Object.entries(solidIcons)
    .filter((entry): entry is [string, IconDefinition] => {
        const value = entry[1]
        return typeof value === "object" && value !== null && "iconName" in value
    })
    .map(([name, definition]) => ({ name, definition }))
    .sort((a, b) => a.name.localeCompare(b.name))

export function getAllSolidIcons(): IconEntry[] {
    return ALL_SOLID_ICONS
}

/** Recherche simple par nom — insensible à la casse, sous-chaîne (pas de recherche floue, le volume d'icônes rend un match exact suffisant). */
export function searchSolidIcons(query: string): IconEntry[] {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return ALL_SOLID_ICONS
    return ALL_SOLID_ICONS.filter((entry) => entry.name.toLowerCase().includes(normalized))
}
