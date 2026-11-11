import type { ReactNode } from "react"

/**
 * Centralisé ici — auparavant dupliqué en local dans FaqAccordion.tsx
 * (highlightMatches), maintenant réutilisé aussi par la recherche globale
 * (GlobalSearchResults.tsx). Un seul endroit pour ajuster la mécanique de
 * découpage/surlignage, jamais 2 implémentations à maintenir en parallèle
 * pour le même besoin.
 *
 * highlightClassName laissé au choix de l'appelant (son propre CSS
 * module) plutôt qu'une classe globale fixe ici — "surligner sans
 * agresser" peut vouloir dire une intensité différente selon le contexte
 * (une FAQ vs un petit menu déroulant de recherche).
 *
 * Retourne le texte tel quel si la requête est vide — l'appelant n'a pas
 * besoin de vérifier lui-même avant d'appeler.
 */
export function highlightMatches(text: string, query: string, highlightClassName: string): ReactNode {
    const trimmed = query.trim()
    if (!trimmed) return text

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    const chunks = text.split(regex)

    return chunks.map((chunk, index) =>
        index % 2 === 1 ? (
            <mark key={index} className={highlightClassName}>
                {chunk}
            </mark>
        ) : (
            chunk
        )
    )
}
