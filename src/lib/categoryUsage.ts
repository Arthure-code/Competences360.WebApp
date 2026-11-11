import { getContentModules } from "@/_mocks/contentModules.mock"
import { getModuleVersionById } from "@/_mocks/moduleVersions.mock"

/**
 * Nombre de modules de l'org dont la version OFFICIELLE utilise cette
 * catégorie — sert d'avertissement avant suppression (voir
 * CategoriesManager.tsx) : supprimer une catégorie encore utilisée ne
 * bloque rien (contrairement à un vrai verrou), mais le formateur/
 * gestionnaire doit le savoir avant de confirmer.
 */
export async function getModuleCountForCategory(categoryId: string, organizationId: string): Promise<number> {
    const modules = await getContentModules(organizationId)
    let count = 0
    for (const module of modules) {
        if (!module.officialVersionId) continue
        const version = await getModuleVersionById(module.officialVersionId)
        if (version?.content.categoryId === categoryId) count++
    }
    return count
}
