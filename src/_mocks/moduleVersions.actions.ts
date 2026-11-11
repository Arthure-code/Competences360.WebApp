"use server"

import { api, apiTolerant, ApiError, StatutHttp } from "@/lib/api"
import type { ContentModule } from "@/types/contentModule"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { ModuleVersion, ModuleVersionContent } from "@/types/moduleVersion"

/**
 * Mutations sur ModuleVersion, branchées sur ContentModulesController.
 *
 * Les identités passées en paramètre (createdByUserId, createdByName,
 * gestionnaireUserId…) restent dans les signatures pour ne pas toucher aux
 * appelants, mais ne sont pas transmises : l'API les tire des claims. Un
 * client ne choisit pas au nom de qui il crée du contenu. organizationId non
 * plus n'est envoyé là où l'API le déduit du compte.
 */

/** Résultat commun aux trois créations de module — le front navigue vers l'éditeur avec les deux ids. */
interface CreatedModule {
    module: ContentModule
    version: ModuleVersion
}

/**
 * Relit le module d'une version, pour les seules routes qui rendent la
 * version nue. `/scratch` et `/global` rendent déjà le module à côté d'elle
 * (ModuleAvecVersionDto) : les faire passer par ici revenait à lire un
 * `moduleId` absent, donc un `GET /api/contentmodules/undefined` en 404 et un
 * bouton figé sur « Création… ».
 */
async function withModule(version: ModuleVersion): Promise<CreatedModule> {
    const module = await api.get<ContentModule>(
        `/api/contentmodules/${encodeURIComponent(version.moduleId)}`)

    return { module, version }
}

/**
 * Modules du catalogue de plateforme pas encore repris par cette
 * organisation. Le filtrage est fait par l'API, seule à connaître
 * l'ensemble des forks.
 */
export async function getForkableModules(organizationId: string): Promise<PlatformTemplate[]> {
    return await apiTolerant(
        () => api.get<PlatformTemplate[]>(
            `/api/contentmodules/forkable/${encodeURIComponent(organizationId)}`),
        [],
    )
}

interface CreateModuleFromScratchInput {
    organizationId: string
    createdByUserId: string
    createdByName: string
    /** Note optionnelle — le résumé principal est généré automatiquement (voir lib/versionDiff.ts) */
    changeNote?: string
    content: ModuleVersionContent
}

/** Création de A à Z — crée le ContentModule ET sa première version d'un coup. */
export async function createModuleFromScratch(input: CreateModuleFromScratchInput): Promise<CreatedModule> {
    // La route rend le module et sa version : rien à relire.
    return await api.post<CreatedModule>("/api/contentmodules/scratch", {
        organizationId: Number(input.organizationId),
        changeNote: input.changeNote,
        content: input.content,
    })
}

interface CreateModuleFromGlobalInput {
    sourceGlobalModuleId: string
    organizationId: string
    createdByUserId: string
    createdByName: string
    changeNote?: string
}

/** Fork depuis le catalogue de plateforme. undefined si la source est introuvable ou déjà reprise. */
export async function createModuleFromGlobal(input: CreateModuleFromGlobalInput): Promise<CreatedModule | undefined> {
    try {
        return await api.post<CreatedModule>("/api/contentmodules/global", {
            sourceGlobalModuleId: input.sourceGlobalModuleId,
            organizationId: Number(input.organizationId),
            changeNote: input.changeNote,
        })
    } catch (error) {
        if (error instanceof ApiError && error.status === StatutHttp.RequeteInvalide) return undefined
        throw error
    }
}

interface CreateModuleFromOrgVersionInput {
    sourceVersionId: string
    organizationId: string
    createdByUserId: string
    createdByName: string
    changeNote?: string
}

/**
 * Symétrique de createModuleFromGlobal, mais la source est une version déjà
 * publiée DANS l'organisation (voir ForkModulePicker) : reprendre le travail
 * d'un collègue pour le personnaliser, pas seulement l'assigner tel quel.
 */
export async function createModuleFromOrgVersion(input: CreateModuleFromOrgVersionInput): Promise<CreatedModule | undefined> {
    try {
        const version = await api.post<ModuleVersion>("/api/contentmodules/org-version", {
            sourceVersionId: Number(input.sourceVersionId),
            changeNote: input.changeNote,
        })

        return await withModule(version)
    } catch (error) {
        if (error instanceof ApiError && error.status === StatutHttp.RequeteInvalide) return undefined
        throw error
    }
}

interface CreateNewVersionInput {
    moduleId: string
    /** Version choisie comme point de départ (dropdown « créer une nouvelle version ») — son contenu est copié */
    sourceVersionId: string
    organizationId: string
    createdByUserId: string
    createdByName: string
    changeNote?: string
}

/**
 * Nouvelle version au sein d'un module EXISTANT. undefined si la limite de
 * versions est atteinte : la vérification est faite par l'API, seule à
 * connaître le compte réel au moment de l'appel.
 */
export async function createNewVersionInModule(input: CreateNewVersionInput): Promise<ModuleVersion | undefined> {
    try {
        return await api.post<ModuleVersion>("/api/contentmodules/versions", {
            moduleId: Number(input.moduleId),
            sourceVersionId: Number(input.sourceVersionId),
            changeNote: input.changeNote,
        })
    } catch (error) {
        if (error instanceof ApiError && error.status === StatutHttp.RequeteInvalide) return undefined
        throw error
    }
}

/**
 * draft vers published. Instantané, aucune approbation.
 *
 * publishedAsGestionnaireUserId présent : la publication vaut révision et la
 * version est appliquée officiellement dans la foulée. L'API ne l'honore que
 * si l'appelant a réellement le rôle gestionnaire.
 */
export async function publishVersion(versionId: string, publishedAsGestionnaireUserId?: string): Promise<void> {
    const officialiser = publishedAsGestionnaireUserId ? "?officialiser=true" : ""

    await api.put(
        `/api/contentmodules/versions/${encodeURIComponent(versionId)}/publish${officialiser}`)
}

/** Symétrique de publishVersion — refusé par l'API si la version est devenue officielle. */
export async function unpublishVersion(versionId: string): Promise<void> {
    await api.put(`/api/contentmodules/versions/${encodeURIComponent(versionId)}/unpublish`)
}

/** Déplace le pointeur officiel du module. Réservé au gestionnaire. */
export async function applyOfficialVersion(moduleId: string, versionId: string, gestionnaireUserId: string): Promise<void> {
    void gestionnaireUserId

    await api.put(
        `/api/contentmodules/${encodeURIComponent(moduleId)}/apply/${encodeURIComponent(versionId)}`)
}

/**
 * published vers draft, avec motif obligatoire. Si c'était la version
 * officielle, le module retombe sur la version publiée la plus récente
 * restante — un vrai retour arrière, pas une coupure.
 */
export async function revertToDraft(versionId: string, gestionnaireUserId: string, gestionnaireName: string, reason: string): Promise<void> {
    void gestionnaireUserId
    void gestionnaireName

    await api.put(
        `/api/contentmodules/versions/${encodeURIComponent(versionId)}/revert`,
        { reason },
    )
}

/**
 * Le formateur renvoie sa version après avoir traité les commentaires.
 *
 * Le compte de commentaires non résolus est refait par l'API au moment de
 * l'appel : un commentaire ajouté depuis l'ouverture de la page fait échouer
 * la resoumission plutôt que de passer inaperçu.
 */
export async function resubmitForReview(versionId: string): Promise<{ success: boolean; unresolvedCount: number }> {
    return await apiTolerant(
        () => api.put<{ success: boolean; unresolvedCount: number }>(
            `/api/contentmodules/versions/${encodeURIComponent(versionId)}/resubmit`),
        { success: false, unresolvedCount: 0 },
    )
}

/** Auto-enregistrement de l'éditeur. Autorisé seulement sur un brouillon de l'appelant. */
export async function updateModuleVersionContent(versionId: string, content: ModuleVersionContent): Promise<void> {
    await api.put(
        `/api/contentmodules/versions/${encodeURIComponent(versionId)}/content`,
        { content },
    )
}

export async function deleteModuleVersion(versionId: string): Promise<void> {
    await api.delete(`/api/contentmodules/versions/${encodeURIComponent(versionId)}`)
}

/** Suppression groupée — même règle que l'unitaire, appliquée par l'API. */
export async function deleteModuleVersions(versionIds: string[]): Promise<void> {
    if (versionIds.length === 0) return

    await api.post("/api/contentmodules/versions/delete-batch", {
        versionIds: versionIds.map(Number),
    })
}