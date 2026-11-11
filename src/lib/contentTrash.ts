import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"

/** Indique si la fenêtre de récupération d'un module en corbeille est écoulée. */
export function isTrashExpired(trashedAt: string, joursRetention: number): boolean {
    const daysSinceTrashed = (Date.now() - new Date(trashedAt).getTime()) / 86_400_000
    return daysSinceTrashed >= joursRetention
}

/** Retourne le nombre de jours restants avant la purge automatique. Jamais négatif. */
export function getDaysRemainingInTrash(trashedAt: string, joursRetention: number): number {
    const daysSinceTrashed = (Date.now() - new Date(trashedAt).getTime()) / 86_400_000
    return Math.max(0, Math.ceil(joursRetention - daysSinceTrashed))
}

/**
 * Indique si la personne peut mettre ce module à la corbeille : un gestionnaire
 * de l'organisation, ou le créateur de la version officielle, à défaut de la
 * plus récente.
 */
export function canTrashModule(
    module: ContentModule,
    versions: ModuleVersion[],
    userId: string,
    isGestionnaireOfThisOrg: boolean
): boolean {
    if (isGestionnaireOfThisOrg) return true

    const officialVersion = module.officialVersionId ? versions.find((v) => v.id === module.officialVersionId) : undefined
    if (officialVersion) return officialVersion.createdByUserId === userId

    const mostRecent = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    return mostRecent?.createdByUserId === userId
}
