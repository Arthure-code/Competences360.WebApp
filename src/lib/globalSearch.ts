import { getContentModules } from "@/_mocks/contentModules.mock"
import { getMyManagedGroups, getGroupsForOrganization } from "@/_mocks/groups.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { getMyGroups } from "@/_mocks/groups.mock"
import { getAssignedModulesStructural } from "@/lib/assignedModules"
import { routes } from "@/constants/routes"
import type { SearchResult } from "@/types/searchResult"

const MAX_RESULTS_PER_TYPE = 5

function matches(text: string, query: string): boolean {
    return text.toLowerCase().includes(query.toLowerCase())
}

/**
 * Scopé à ce que CE formateur possède réellement (ses modules, ses
 * groupes gérés, les apprenants de ces groupes), pas l'org entière,
 * contrairement à searchGestionnaire.
 */
export async function searchFormateur(query: string, userId: string, organizationId: string): Promise<SearchResult[]> {
    const [modules, groups, apprenants] = await Promise.all([
        getContentModules(organizationId),
        getMyManagedGroups(userId),
        getApprenantSummariesForFormateur(userId),
    ])

    const results: SearchResult[] = []

    modules
        .filter((m) => m.title && matches(m.title, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((m) =>
            results.push({
                id: `module-${m.id}`,
                type: "module",
                label: m.title,
                href: routes.formateur.contenu.module(m.id),
            })
        )

    groups
        .filter((g) => matches(g.name, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((g) =>
            results.push({
                id: `group-${g.id}`,
                type: "group",
                label: g.name,
                href: routes.formateur.groupes.bySlug(g.slug),
            })
        )

    const uniqueApprenants = Array.from(new Map(apprenants.map((a) => [a.userId, a])).values())
    uniqueApprenants
        .filter((a) => matches(a.fullName, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((a) =>
            results.push({
                id: `member-${a.userId}`,
                type: "member",
                label: a.fullName,
                description: a.groupName,
                href: routes.formateur.apprenants.bySlug(a.userId),
            })
        )

    return results
}

/**
 * Vue org entière (tous les modules officiels/partagés, tous les
 * groupes, tous les membres, peu importe qui les gère), contrairement à
 * searchFormateur qui reste scopé à ce que le formateur courant possède.
 */
export async function searchGestionnaire(query: string, organizationId: string): Promise<SearchResult[]> {
    const [modules, groups, members] = await Promise.all([
        getContentModules(organizationId),
        getGroupsForOrganization(organizationId),
        getOrganizationMembers(organizationId),
    ])

    const results: SearchResult[] = []

    modules
        .filter((m) => m.title && matches(m.title, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((m) =>
            results.push({
                id: `module-${m.id}`,
                type: "module",
                label: m.title,
                href: routes.gestionnaire.contenu.module(m.id),
            })
        )

    groups
        .filter((g) => matches(g.name, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((g) =>
            results.push({
                id: `group-${g.id}`,
                type: "group",
                label: g.name,
                href: routes.gestionnaire.groupes.bySlug(g.slug),
            })
        )

    members
        .filter((m) => matches(m.fullName, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((m) =>
            results.push({
                id: `member-${m.id}`,
                type: "member",
                label: m.fullName,
                description: m.email,
                href: routes.gestionnaire.membres,
            })
        )

    return results
}

/**
 * Scopé à ce que CET apprenant voit réellement (ses modules assignés via
 * ses groupes, ses propres groupes) — pas de recherche par membre, un
 * apprenant ne parcourt pas l'annuaire de l'org. N'utilise plus
 * getAllModules/group.moduleIds (ancien catalogue statique, reliquat) —
 * getAssignedModulesStructural (lib/assignedModules.ts) résout depuis les
 * vraies assignations, même source que Modules/Accueil/Parcours.
 */
export async function searchApprenant(query: string, userId: string): Promise<SearchResult[]> {
    const groups = await getMyGroups(userId)
    const assignedResults = await getAssignedModulesStructural(
        userId,
        groups.map((g) => g.id)
    )

    const results: SearchResult[] = []

    assignedResults
        .map((r) => r.module)
        .filter((m) => matches(m.title, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((m) =>
            results.push({
                id: `module-${m.id}`,
                type: "module",
                label: m.title,
                href: routes.apprenant.modules.bySlug(m.slug),
            })
        )

    groups
        .filter((g) => matches(g.name, query))
        .slice(0, MAX_RESULTS_PER_TYPE)
        .forEach((g) =>
            results.push({
                id: `group-${g.id}`,
                type: "group",
                label: g.name,
                href: routes.apprenant.groupes.bySlug(g.slug),
            })
        )

    return results
}