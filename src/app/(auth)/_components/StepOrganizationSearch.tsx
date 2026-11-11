"use client"

import { useState } from "react"
import StepShell from "./StepShell"
import Button from "@/components/ui/Button"
import { searchOrganizationsByName } from "@/_mocks/organizations.mock"
import type { Organization } from "@/types/organization"
import styles from "./StepOrganizationSearch.module.css"

interface StepOrganizationSearchProps {
    onBack: () => void
    onOrganizationFound: (organization: Organization) => void
    /**
     * Le nom cherché est remonté : c'est lui qui nommera l'organisation
     * créée à l'étape suivante. Sans lui, le formulaire n'aurait aucun nom à
     * donner et ne pourrait pas terminer le parcours.
     */
    onOrganizationNotFound: (nomRecherche: string) => void
}

/**
 * Un gestionnaire ne peut jamais rejoindre une org existante depuis cette
 * recherche — trouvée = cul-de-sac (StepInviteOnly), il doit être invité.
 * Introuvable = il continue vers la création de SON compte (pas de l'org,
 * qui se crée après, dans le dashboard, via la garde d'accès prévue).
 */
export default function StepOrganizationSearch({
    onBack,
    onOrganizationFound,
    onOrganizationNotFound,
}: StepOrganizationSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Organization[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    async function handleSearch() {
        if (!query.trim()) return
        const found = await searchOrganizationsByName(query)
        setResults(found)
        setHasSearched(true)
    }

    return (
        <StepShell
            title="Votre organisation est-elle déjà inscrite ?"
            subtitle="Recherchez son nom pour vérifier avant de créer votre compte gestionnaire."
            footer={{
                backLabel: "Retour",
                onBack,
                continueLabel: "Elle n'y est pas? Continuer",
                onContinue: () => onOrganizationNotFound(query),
            }}
        >
            <div className={styles.searchRow}>
                <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nom de l'organisation"
                    className={styles.input}
                />
                <Button label="Rechercher" onClick={handleSearch} />
            </div>

            {hasSearched && results.length > 0 && (
                <div className={styles.results}>
                    {results.map((organization) => (
                        <button
                            key={organization.id}
                            type="button"
                            className={styles.resultItem}
                            onClick={() => onOrganizationFound(organization)}
                        >
                            {organization.name}
                        </button>
                    ))}
                </div>
            )}

            {hasSearched && results.length === 0 && (
                <p className={styles.noResults}>
                    Aucune organisation trouvée avec ce nom — vous pouvez continuer pour créer votre compte.
                </p>
            )}
        </StepShell>
    )
}