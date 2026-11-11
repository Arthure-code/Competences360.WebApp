"use server"

import { getAllOrganizations } from "@/_mocksToMigrate/organizations.mock"
import { getAllAdmins } from "@/_mocksAdmin/adminAuth.mock"
import { searchUsersAcrossOrgs } from "@/_mocksToMigrate/userSearch.mock"
import { getAdminFullName } from "@/lib/adminUser"
import { routes } from "@/constants/routes"

/**
 * "use server" obligatoire ici — contrairement aux autres .mock.ts du
 * projet (appelés depuis des Server Components, page.tsx), searchAdmin
 * est appelée DIRECTEMENT depuis AdminShell.tsx (composant client, sur
 * chaque frappe). Sans cette directive, Next.js tente de regrouper toute
 * la chaîne d'import dans le bundle client — jusqu'à adminAuth.mock.ts,
 * qui utilise next/headers (strictement serveur) — et le build échoue.
 */

export interface AdminSearchResult {
    id: string
    label: string
    /** Sous-texte secondaire — ex. le courriel pour un admin */
    sublabel: string
    type: "organisation" | "administrateur" | "utilisateur"
    href: string
    /** Seulement pertinent pour type "utilisateur" — absent pour organisation/administrateur */
    isActive?: boolean
}

/**
 * Cherche à travers 3 domaines : organisations, comptes admin, et
 * utilisateurs (apprenant/formateur/gestionnaire — voir userSearch.mock.ts,
 * maintenant disponible). Les 3 recherches en parallèle, un seul message
 * d'absence de résultat qui couvre les 3 (voir AdminSearchResults.tsx).
 */
export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    const [organizations, admins, users] = await Promise.all([
        getAllOrganizations(),
        getAllAdmins(),
        searchUsersAcrossOrgs(query),
    ])

    const orgResults: AdminSearchResult[] = organizations
        .filter((org) => org.name.toLowerCase().includes(normalized))
        .map((org) => ({
            id: org.id,
            label: org.name,
            sublabel: "Organisation",
            type: "organisation" as const,
            href: routes.admin.organisations.bySlug(org.id),
        }))

    const adminResults: AdminSearchResult[] = admins
        .filter((admin) => getAdminFullName(admin).toLowerCase().includes(normalized) || admin.email.toLowerCase().includes(normalized))
        .map((admin) => ({
            id: admin.id,
            label: getAdminFullName(admin),
            sublabel: admin.email,
            type: "administrateur" as const,
            href: routes.admin.administrateurs,
        }))

    const userResults: AdminSearchResult[] = users.map((user) => ({
        id: user.id,
        label: user.fullName,
        sublabel: `${user.email} — ${user.organizationName}`,
        type: "utilisateur" as const,
        href: routes.admin.utilisateurs.bySlug(user.id),
        isActive: user.isActive,
    }))

    return [...orgResults, ...adminResults, ...userResults]
}