import type { Role } from "./roles"

/**
 * Préfixes de route où la Topbar est cachée, par rôle — ex. les pages
 * plein-écran d'un module ou d'un groupe côté apprenant. Vit ici plutôt
 * qu'en dur dans le shell, pour que AppShell reste générique et que
 * chaque rôle ajoute ses propres cas sans toucher au composant.
 */
export const HIDDEN_TOPBAR_PREFIXES: Record<Role, string[]> = {
    apprenant: ["/apprenant/modules/", "/apprenant/groupes"],
    formateur: ["/formateur/contenu/"],
    gestionnaire: [],
}
