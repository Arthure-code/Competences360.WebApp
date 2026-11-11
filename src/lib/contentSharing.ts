import { getAssignmentsForContentModule, getAssignmentsForContentModules } from "@/_mocks/assignments.mock"
import { getGroupMemberCounts } from "@/_mocks/groups.mock"
import { getContentModules } from "@/_mocks/contentModules.mock"
import { getVersionsForModules } from "@/_mocks/moduleVersions.mock"
import type { Assignment } from "@/types/assignment"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"

/**
 * Fusionné depuis contentModules.ts — 3 petites fonctions déjà couplées
 * dans les faits (getAttributionLabel était déjà importée ici), pas de
 * raison réelle de garder 2 fichiers séparés pour le même thème
 * (ContentModule/ModuleVersion).
 */

/**
 * Version à afficher en aperçu — l'officielle si elle existe, sinon la
 * plus récente créée (peu importe qui) — pour toujours avoir quelque
 * chose de représentatif à montrer, même sans version officielle.
 */
export function getPreviewVersion(module: ContentModule, versions: ModuleVersion[]): ModuleVersion | undefined {
    if (module.officialVersionId) {
        return versions.find((version) => version.id === module.officialVersionId)
    }
    return mostRecent(versions)
}

export function mostRecent(versions: ModuleVersion[]): ModuleVersion {
    return [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

/**
 * "Par {org} — créé par {nom}" si officielle, "Par {nom}" sinon — dérivé
 * à l'affichage, jamais stocké.
 */
export function getAttributionLabel(version: ModuleVersion, module: ContentModule, organizationName: string): string {
    const isOfficial = version.id === module.officialVersionId
    return isOfficial ? `Par ${organizationName} — créé par ${version.createdByName}` : `Par ${version.createdByName}`
}

/**
 * Nombre de personnes réellement couvertes par CETTE version précise —
 * membres des groupes assignés + apprenants assignés individuellement.
 * Une assignation sans versionId (suit l'officielle du moment) ne compte
 * que pour la version ACTUELLEMENT officielle du module, jamais pour une
 * autre — sinon une version non-officielle afficherait une couverture
 * qu'elle n'a pas vraiment.
 */
export async function getVersionCoverageCount(
    moduleId: string,
    versionId: string,
    officialVersionId: string | null
): Promise<number> {
    // L'API rend déjà les assignations de ce module — épinglées comme
    // suiveuses de l'officielle. Ne restait ici qu'à trancher laquelle
    // couvre RÉELLEMENT la version demandée.
    const assignments = await getAssignmentsForContentModule(moduleId)
    const effectifs = await chargerEffectifs(assignments)

    return compterCouverture(assignments, versionId, officialVersionId, effectifs)
}

/** Les effectifs des groupes visés par ces assignations, en un seul appel. */
async function chargerEffectifs(assignments: Assignment[]): Promise<Map<string, number>> {
    const groupIds = Array.from(new Set(
        assignments
            .filter((a) => a.assignedTo.type === "group")
            .map((a) => (a.assignedTo as { groupId: string }).groupId)))

    return await getGroupMemberCounts(groupIds)
}

/**
 * Le décompte lui-même, sur des données DÉJÀ chargées — donc synchrone.
 *
 * Exporté pour les écrans qui traitent plusieurs modules d'un coup : ils
 * chargent assignations et effectifs une seule fois, puis appellent cette
 * fonction autant de fois qu'ils ont de versions à compter. Le coût réseau
 * ne suit alors ni le nombre de versions ni celui des groupes.
 */
export function compterCouverture(
    assignments: Assignment[],
    versionId: string,
    officialVersionId: string | null,
    effectifs: Map<string, number>
): number {
    const relevantAssignments = assignments.filter((a) => {
        const effectiveVersionId = a.versionId ?? officialVersionId
        return effectiveVersionId === versionId
    })

    let total = 0
    for (const assignment of relevantAssignments) {
        if (assignment.assignedTo.type === "apprenant") {
            total += 1
        } else {
            total += effectifs.get(assignment.assignedTo.groupId) ?? 0
        }
    }
    return total
}

export interface ForkableOrgVersion {
    version: ModuleVersion
    module: ContentModule
    isOfficial: boolean
    attributionLabel: string
}

/**
 * Tout le contenu publié de l'org, forkable pour être personnalisé —
 * mêmes versions que "Partagé" + "Contenu de l'org" (voir
 * getSharedModuleGroups plus haut), mais en liste plate avec le module
 * associé, pour ForkModulePicker. Réutiliser le travail d'un collègue en
 * partant de son contenu, pas seulement l'assigner tel quel.
 */
export async function getForkableOrgVersions(
    organizationId: string,
    organizationName: string
): Promise<ForkableOrgVersion[]> {
    const modules = await getContentModules(organizationId)
    const results: ForkableOrgVersion[] = []

    // Toutes les versions en un seul appel : le coût réseau ne suit pas le
    // nombre de modules de l'organisation.
    const versionsParModule = await getVersionsForModules(modules.map((m) => m.id))

    for (const module of modules) {
        const versions = versionsParModule.get(module.id) ?? []
        for (const version of versions) {
            if (version.status !== "published") continue
            results.push({
                version,
                module,
                isOfficial: version.id === module.officialVersionId,
                attributionLabel: getAttributionLabel(version, module, organizationName),
            })
        }
    }

    return results
}

export interface SharedVersionEntry {
    version: ModuleVersion
    /** Position réelle parmi TOUTES les versions du module, triées par création — pas dérivé de l'id */
    versionNumber: number
    attributionLabel: string
    isMine: boolean
    coverageCount: number
}

export interface SharedModuleGroup {
    module: ContentModule
    versions: SharedVersionEntry[]
}

/**
 * Contenu "Partagé" groupé par module — toutes les versions publiées,
 * non-officielles, de toute l'org (la mienne ET celles des collègues,
 * voir la discussion sur les onglets : un formateur voit tout, un
 * gestionnaire aussi mais sans doublon avec sa file "À réviser").
 *
 * excludeVersionIds : pour le gestionnaire, la version déjà auto-appliquée
 * en attente de confirmation (voir getModulesPendingReview,
 * contentModules.mock.ts) — elle reste seulement dans "À réviser", pas
 * dupliquée ici. Absent côté formateur (rien à exclure).
 */
export async function getSharedModuleGroups(
    organizationId: string,
    currentUserId: string,
    organizationName: string,
    excludeVersionIds: Set<string> = new Set()
): Promise<SharedModuleGroup[]> {
    const modules = await getContentModules(organizationId)
    const groups: SharedModuleGroup[] = []

    const moduleIds = modules.map((m) => m.id)

    // Trois lectures pour tout le contenu de l'organisation : les versions, les
    // assignations, les effectifs. Le nombre d'appels ne suit ni le nombre de
    // modules ni celui des versions.
    const [versionsParModule, assignationsParModule] = await Promise.all([
        getVersionsForModules(moduleIds),
        getAssignmentsForContentModules(moduleIds),
    ])

    const effectifs = await chargerEffectifs(
        Array.from(assignationsParModule.values()).flat())

    for (const module of modules) {
        const versions = versionsParModule.get(module.id) ?? []
        const assignationsDuModule = assignationsParModule.get(module.id) ?? []
        const sharedVersions = versions.filter(
            (v) =>
                v.status === "published" && v.id !== module.officialVersionId && !excludeVersionIds.has(v.id)
        )
        if (sharedVersions.length === 0) continue

        // Même logique que ModulePageView/edit page.tsx : v1 = la plus ancienne parmi TOUTES les versions du module, pas seulement les partagées.
        const ascending = [...versions].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )

        const entries: SharedVersionEntry[] = []
        for (const version of sharedVersions) {
            entries.push({
                version,
                versionNumber: ascending.findIndex((v) => v.id === version.id) + 1,
                attributionLabel: getAttributionLabel(version, module, organizationName),
                isMine: version.createdByUserId === currentUserId,
                coverageCount: compterCouverture(
                    assignationsDuModule, version.id, module.officialVersionId, effectifs),
            })
        }

        // La mienne en premier, puis les plus récentes — pour se retrouver
        // rapidement dans un groupe qui mélange plusieurs personnes.
        entries.sort((a, b) => {
            if (a.isMine !== b.isMine) return a.isMine ? -1 : 1
            return new Date(b.version.createdAt).getTime() - new Date(a.version.createdAt).getTime()
        })

        groups.push({ module, versions: entries })
    }

    return groups
}