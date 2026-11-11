import { getMyManagedGroups } from "@/_mocks/groups.mock"
import { getApprenantSummariesForFormateur } from "@/_mocks/apprenantSummaries.mock"
import { getMyDraftVersions, getMyPublishedVersions } from "@/_mocks/moduleVersions.mock"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getStaffDossier } from "@/_mocks/organizationMembers.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import type { Group } from "@/types/group"

const VIDE = { draftCount: 0, publishedCount: 0, officialCount: 0 }

export interface StaffContentStats {
    draftCount: number
    publishedCount: number
    /** Modules dont cette personne a créé la version actuellement officielle. */
    officialCount: number
}

export interface StaffDossierStats {
    managedGroups: Group[]
    /** Apprenants uniques, dédoublonnés entre les groupes gérés. */
    apprenantCount: number
    content: StaffContentStats
}

/**
 * Assemble le dossier d'un membre du personnel : groupes gérés, apprenants
 * sous responsabilité, contenu créé.
 *
 * Pour le compte connecté, agrège les lectures « les miennes ». Pour
 * quelqu'un d'autre, interroge la route dédiée : ces lectures répondent
 * toujours pour le compte authentifié et donneraient les chiffres du
 * lecteur. Une session d'administration passe toujours par la route dédiée.
 */
export async function computeStaffDossier(userId: string): Promise<StaffDossierStats> {
    const autrePersonne = (await getCurrentAdminSession())
        ? true
        : String(userId) !== String((await getCurrentSession()).user.id)

    if (autrePersonne) {
        const dossier = await getStaffDossier(userId)

        if (dossier == null)
            return { managedGroups: [], apprenantCount: 0, content: VIDE }

        return {
            managedGroups: dossier.managedGroups as Group[],
            apprenantCount: dossier.apprenantCount,
            content: {
                draftCount: dossier.draftCount,
                publishedCount: dossier.publishedCount,
                officialCount: dossier.officialCount,
            },
        }
    }

    const [managedGroups, drafts, published] = await Promise.all([
        getMyManagedGroups(userId),
        getMyDraftVersions(userId),
        getMyPublishedVersions(userId),
    ])

    // Les fiches sont émises par (apprenant, groupe) : dédoublonner évite de
    // compter deux fois une personne présente dans deux groupes gérés.
    const summaries = await getApprenantSummariesForFormateur(userId)
    const apprenantIds = new Set(summaries.map((summary) => summary.userId))

    // Seuls les modules qu'elle a publiés peuvent avoir sa version comme
    // officielle : la boucle reste courte.
    const moduleIds = Array.from(new Set(published.map((version) => version.moduleId)))
    const modules = await Promise.all(moduleIds.map((id) => getContentModuleById(id)))

    const idsPublies = new Set(published.map((version) => version.id))
    const officialCount = modules.filter(
        (module) => module?.officialVersionId && idsPublies.has(module.officialVersionId)
    ).length

    return {
        managedGroups,
        apprenantCount: apprenantIds.size,
        content: {
            draftCount: drafts.length,
            publishedCount: published.length,
            officialCount,
        },
    }
}