"use server"

import { api, apiTolerant } from "@/lib/api"
import { assertCompteConnecte } from "@/_mocks/users.mock"
import type { ModuleVersion } from "@/types/moduleVersion"

/**
 * Lectures sur ModuleVersion, branchées sur ContentModulesController.
 *
 * MAX_VERSIONS_PER_MODULE et VERSION_WARNING_THRESHOLD ont déménagé dans
 * constants/contentLimits.ts : un module "use server" ne peut exporter que
 * des fonctions async, et deux composants client les lisent.
 */

/**
 * Le ContentJson stocké ne porte pas toujours `description` ni
 * `practiceItems` : ces deux champs n'existent que dans le brouillon de
 * l'éditeur, et aucune version en base ne les a. `NiveauDraft` les déclare
 * pourtant obligatoires, si bien que les consommateurs les lisaient sans
 * précaution et plantaient — page blanche sur l'introduction d'activité
 * côté apprenant et sur l'atelier d'édition côté formateur.
 *
 * Le repli vit ici, au point d'entrée, plutôt que chez chaque lecteur : un
 * seul endroit à retirer le jour où le contenu portera vraiment ces champs.
 */
function normaliser(version: ModuleVersion | null): ModuleVersion | undefined {
    if (version == null) return undefined

    // Les versions antérieures à l'ajout des liens externes n'ont pas ce champ.
    if (version.content) version.content.externalLinks ??= []

    const niveaux = version.content?.niveaux
    if (!Array.isArray(niveaux)) return version

    for (const niveau of niveaux) {
        // `subtitle` est ce que le contenu porte à la place de `description`.
        niveau.description ??= (niveau as { subtitle?: string }).subtitle ?? ""
        niveau.practiceItems ??= []
        niveau.durationMinutes ??= 0
        niveau.exercises ??= []
    }

    return version
}

function normaliserListe(versions: ModuleVersion[]): ModuleVersion[] {
    return versions.map((version) => normaliser(version) as ModuleVersion)
}

export async function getModuleVersionById(versionId: string): Promise<ModuleVersion | undefined> {
    const version = await apiTolerant(
        () => api.get<ModuleVersion | null>(
            `/api/contentmodules/versions/${encodeURIComponent(versionId)}`),
        null,
    )

    return normaliser(version)
}

/** Toutes les versions d'un module, la plus récente en premier — alimente l'onglet « Historique des versions ». */
export async function getVersionsForModule(moduleId: string): Promise<ModuleVersion[]> {
    const versions = await apiTolerant(
        () => api.get<ModuleVersion[]>(`/api/contentmodules/${encodeURIComponent(moduleId)}/versions`),
        [],
    )

    return normaliserListe(versions)
}

/**
 * Variante en lot : un seul aller-retour pour toute une liste de modules.
 * Un identifiant hors de portée est absent de la réponse, donc rendu avec
 * une liste vide, exactement ce que rendait la lecture unitaire.
 */
export async function getVersionsForModules(moduleIds: string[]): Promise<Map<string, ModuleVersion[]>> {
    if (moduleIds.length === 0) return new Map()

    const lignes = await apiTolerant(
        () => api.post<{ moduleId: string; versions: ModuleVersion[] }[]>(
            "/api/contentmodules/versions/lot",
            { moduleIds: moduleIds.map(Number) }),
        [],
    )

    return new Map(lignes.map((ligne) => [String(ligne.moduleId), normaliserListe(ligne.versions)]))
}

export async function getVersionCountForModule(moduleId: string): Promise<number> {
    return await apiTolerant(
        () => api.get<number>(`/api/contentmodules/${encodeURIComponent(moduleId)}/versions/count`),
        0,
    )
}

export async function getMyDraftVersions(userId: string): Promise<ModuleVersion[]> {
    await assertCompteConnecte(userId, "getMyDraftVersions")

    const versions = await apiTolerant(
        () => api.get<ModuleVersion[]>("/api/contentmodules/versions/mine/drafts"),
        [],
    )

    return normaliserListe(versions)
}

export async function getMyPublishedVersions(userId: string): Promise<ModuleVersion[]> {
    await assertCompteConnecte(userId, "getMyPublishedVersions")

    const versions = await apiTolerant(
        () => api.get<ModuleVersion[]>("/api/contentmodules/versions/mine/published"),
        [],
    )

    return normaliserListe(versions)
}

/** Tous formateurs confondus — « Contenu des formateurs » (gestionnaire), ou « Officiel de l'org » en lecture seule côté formateur. */
export async function getOrgPublishedVersions(organizationId: string): Promise<ModuleVersion[]> {
    const versions = await apiTolerant(
        () => api.get<ModuleVersion[]>(
            `/api/contentmodules/versions/organisation/${encodeURIComponent(organizationId)}/published`),
        [],
    )

    return normaliserListe(versions)
}