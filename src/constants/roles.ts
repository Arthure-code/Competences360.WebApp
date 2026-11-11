export const ROLES = ["apprenant", "formateur", "gestionnaire"] as const

export type Role = (typeof ROLES)[number]

/**
 * Libellé neutre du rôle. L'affichage genré ("Apprenante" vs "Apprenant")
 * vient du profil utilisateur (backend), pas d'ici — ceci sert pour tout
 * ce qui n'a pas accès au profil (garde de route, logs, menus génériques).
 */
export const ROLE_LABELS: Record<Role, string> = {
    apprenant: "Apprenant",
    formateur: "Formateur",
    gestionnaire: "Gestionnaire",
}

export function isRole(value: string): value is Role {
    return (ROLES as readonly string[]).includes(value)
}