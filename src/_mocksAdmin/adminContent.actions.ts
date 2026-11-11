"use server"

import { ADMIN_COOKIE, api } from "@/lib/api"
import { getAllOrganizations } from "@/_mocks/organizations.mock"
import { getModuleVersionById } from "@/_mocks/moduleVersions.mock"
import { getModuleCountForCategory } from "@/lib/categoryUsage"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion, ModuleVersionContent } from "@/types/moduleVersion"

/**
 * Mutations de contenu pour Admin — MÊMES routes que moduleVersions.actions.ts
 * (le vrai fichier, formateur/gestionnaire), pas de duplication. Décision
 * corrigée dans docs/espace-admin-notes-backend.md section 1 : élargir
 * l'autorisation de ces routes précises suffit, inutile de les dupliquer
 * sous /api/admin/...
 *
 * { cookieName: ADMIN_COOKIE } passé EXPLICITEMENT sur chaque appel —
 * patron confirmé dans tous les vrais fichiers reçus (reports.actions.ts,
 * auditLog.mock.ts, userSearch.mock.ts...), jamais laissé au repli
 * automatique de lib/api.ts (qui essaie la session normale EN PREMIER,
 * donnerait la mauvaise identité si une session normale traîne aussi —
 * exactement le bug observé avec "Lea Tremblay" plus tôt).
 *
 * Fichier séparé quand même (pas un simple réemploi de
 * createModuleFromScratch) pour organizationId : envoyé `null`
 * explicitement ici, en appelant api.post directement — pas
 * Number(input.organizationId) comme le fait createModuleFromScratch
 * (qui donnerait `0`, une vraie valeur, pas une absence — l'erreur
 * exacte qui avait faussé le test précédent, voir section 0 du doc).
 */

interface CreatedModule {
    module: ContentModule
    version: ModuleVersion
}

interface CreateAdminModuleFromScratchInput {
    adminId: string
    adminName: string
    changeNote?: string
    content: ModuleVersionContent
}

/** Création de contenu de base — organizationId toujours null, jamais une organisation. Même route que createModuleFromScratch, pas une copie. */
export async function createAdminModuleFromScratch(input: CreateAdminModuleFromScratchInput): Promise<CreatedModule> {
    return await api.post<CreatedModule>(
        "/api/contentmodules/scratch",
        { organizationId: null, changeNote: input.changeNote, content: input.content },
        { cookieName: ADMIN_COOKIE }
    )
}

/** Mes brouillons en tant qu'Admin — URL confirmée par le backend (branche contenu-depuis-administration). */
export async function getMyAdminDraftVersions(adminId: string): Promise<ModuleVersion[]> {
    void adminId // l'API déduit l'identité du cookie .Competences360.Admin, envoyé explicitement ci-dessous
    return await api.get<ModuleVersion[]>(`/api/contentmodules/versions/mine/drafts`, { cookieName: ADMIN_COOKIE })
}

/**
 * Contenu de base — un seul appel, confirmé par le backend, remplace la
 * boucle sur toutes les organisations (getForkableModules × N) qu'on
 * utilisait en attendant. Retourne les vrais ContentModule (pas des
 * PlatformTemplate/gabarits) — les cartes deviennent cliquables.
 */
export async function getBaseContentModules(): Promise<ContentModule[]> {
    return await api.get<ContentModule[]>(`/api/contentmodules/base`, { cookieName: ADMIN_COOKIE })
}

/** Corbeille du contenu de base — même principe, un seul appel. */
export async function getBaseContentTrash(): Promise<ContentModule[]> {
    return await api.get<ContentModule[]>(`/api/contentmodules/base/corbeille`, { cookieName: ADMIN_COOKIE })
}

/**
 * Additif — Réglages (catégories globales). Compte l'utilisation d'une
 * catégorie GLOBALE à l'échelle de TOUTE la plateforme, pas une seule org
 * (contrairement à getModuleCountForCategory, lib/categoryUsage.ts, qui
 * est scopé à une org) : boucle sur chaque organisation via
 * getAllOrganizations (_mocks/organizations.mock), PLUS le contenu de
 * base lui-même (une catégorie globale peut être utilisée par un module
 * de base, pas seulement par une org).
 *
 * Sert canDeleteGlobalCategory (lib/categoryRights.ts) : suppression
 * bloquée si ce compte est > 0.
 *
 * Note : suppose que l'objet Organization retourné par
 * getAllOrganizations a un champ `id` (utilisé partout ailleurs comme
 * organizationId: string, ex. getContentModules). À confirmer si une
 * erreur TS pointe vers un autre nom de champ.
 */
export async function getGlobalCategoryUsageCount(categoryId: string): Promise<number> {
    const organizations = await getAllOrganizations()
    let count = 0

    for (const org of organizations) {
        count += await getModuleCountForCategory(categoryId, org.id)
    }

    const baseModules = await getBaseContentModules()
    for (const module of baseModules) {
        if (!module.officialVersionId) continue
        const version = await getModuleVersionById(module.officialVersionId)
        if (version?.content.categoryId === categoryId) count++
    }

    return count
}

/**
 * Enveloppes Admin pour AdminEditorView.tsx — MÊMES routes que
 * moduleVersions.actions.ts (le vrai fichier), mais celui-ci n'expose
 * aucune option de cookie dans ses signatures. Plutôt que de modifier ce
 * fichier partagé (formateur/gestionnaire en dépendent), ces 5
 * fonctions appellent directement les mêmes routes, avec ADMIN_COOKIE
 * explicite — même raisonnement que createAdminModuleFromScratch plus
 * haut.
 */

export async function adminUpdateModuleVersionContent(versionId: string, content: ModuleVersionContent): Promise<void> {
    await api.put(
        `/api/contentmodules/versions/${encodeURIComponent(versionId)}/content`,
        { content },
        { cookieName: ADMIN_COOKIE }
    )
}

export async function adminPublishVersion(versionId: string): Promise<void> {
    await api.put(`/api/contentmodules/versions/${encodeURIComponent(versionId)}/publish`, undefined, { cookieName: ADMIN_COOKIE })
}

export async function adminUnpublishVersion(versionId: string): Promise<void> {
    await api.put(`/api/contentmodules/versions/${encodeURIComponent(versionId)}/unpublish`, undefined, { cookieName: ADMIN_COOKIE })
}

export async function adminApplyOfficialVersion(moduleId: string, versionId: string): Promise<void> {
    await api.put(
        `/api/contentmodules/${encodeURIComponent(moduleId)}/apply/${encodeURIComponent(versionId)}`,
        undefined,
        { cookieName: ADMIN_COOKIE }
    )
}

export async function adminDeleteModuleVersion(versionId: string): Promise<void> {
    await api.delete(`/api/contentmodules/versions/${encodeURIComponent(versionId)}`, { cookieName: ADMIN_COOKIE })
}

/**
 * Nouveau brouillon à partir d'une version source — sert à la fois
 * "Modifier" (depuis la version officielle, quand aucun brouillon n'est
 * déjà en cours) et "Restaurer" (depuis une ancienne version de
 * l'historique). Même route que createNewVersionInModule (le vrai
 * fichier), ADMIN_COOKIE explicite.
 */
export async function adminCreateNewVersionInModule(moduleId: string, sourceVersionId: string, changeNote?: string): Promise<ModuleVersion | undefined> {
    try {
        return await api.post<ModuleVersion>(
            "/api/contentmodules/versions",
            { moduleId: Number(moduleId), sourceVersionId: Number(sourceVersionId), changeNote },
            { cookieName: ADMIN_COOKIE }
        )
    } catch {
        return undefined
    }
}