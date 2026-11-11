"use client"

import { createContext, useContext } from "react"

/**
 * Diffuse la requête tapée dans la barre de la topbar à n'importe quelle
 * page descendante qui veut s'en servir pour filtrer/surligner son propre
 * contenu — même mécanique que Journal d'audit/Aide (FaqAccordion) ont
 * déjà localement, mais alimentée par la barre GLOBALE plutôt qu'une
 * barre locale à chaque page.
 *
 * Opt-in : une page qui ne lit jamais ce contexte n'est pas affectée —
 * pas de changement de comportement pour les pages qui n'en ont pas
 * besoin (ex. Organisations, dont le filtre pertinent est différent).
 */
const AdminSearchContext = createContext<string>("")

export const AdminSearchProvider = AdminSearchContext.Provider

/** À appeler dans une page Admin qui veut filtrer/surligner son propre contenu avec la requête de la topbar. */
export function useAdminSearchQuery(): string {
    return useContext(AdminSearchContext)
}
