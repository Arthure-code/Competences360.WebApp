import type { AdminUser } from "@/types/adminUser"

/**
 * Même esprit que getFullName(user) pour le système normal — préfère
 * preferredFirstName s'il est présent, sinon firstName. Un seul endroit
 * qui décide comment combiner les 3 champs, pour que tous les affichages
 * (liste Administrateurs, journal d'audit, recherche, topbar) restent
 * cohérents entre eux.
 */
export function getAdminFullName(admin: AdminUser): string {
    const prenom = admin.preferredFirstName?.trim() || admin.firstName
    return `${prenom} ${admin.lastName}`.trim()
}
