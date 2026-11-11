"use server"

import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import type { ContentModule } from "@/types/contentModule"

/**
 * Mutations sur ContentModule. L'organisation n'est jamais transmise :
 * l'API la déduit des claims de session.
 */

/** Réponse de POST /api/contentmodules/scratch : le module et sa première version. */
interface ModuleCreePayload {
    module: ContentModule
}

/**
 * Contenu minimal d'un module neuf, dont l'API extrait le titre.
 * externalLinks: [] ajouté — ModuleVersionContent l'exige maintenant
 * (voir types/moduleVersion.ts), sans ça un module neuf démarrerait avec
 * ce champ manquant plutôt que vide.
 */
function contenuInitial(title: string) {
    return { title, description: "", categoryId: null, niveaux: [], externalLinks: [] }
}

/** Crée un module et sa première version en brouillon. */
export async function createContentModule(input: {
    title: string
    organizationId: string
    forkedFromGlobalModuleId?: string
}): Promise<ContentModule> {
    const cree = await api.post<ModuleCreePayload>("/api/contentmodules/scratch", {
        changeNote: "Version initiale",
        content: contenuInitial(input.title),
        forkedFromGlobalModuleId: input.forkedFromGlobalModuleId,
    })

    return cree.module
}

/**
 * Sans effet. L'API applique elle-même la version à la publication tant
 * qu'aucun gestionnaire n'est intervenu. Conservée pour son appelant.
 */
export async function autoApplyIfNeverReviewed(
    moduleId: string,
    versionId: string
): Promise<void> {
    void moduleId
    void versionId
}

/** Déplace le pointeur officiel. Réservé au gestionnaire, vérifié côté API. */
export async function applyOfficialVersion(
    moduleId: string,
    versionId: string,
    gestionnaireUserId: string
): Promise<void> {
    void gestionnaireUserId

    await api.put(
        `/api/contentmodules/${encodeURIComponent(moduleId)}/apply/${encodeURIComponent(versionId)}`)
}

/** Retire le pointeur officiel et marque le module comme examiné. */
export async function clearOfficialVersion(moduleId: string): Promise<void> {
    await api.delete(`/api/contentmodules/${encodeURIComponent(moduleId)}/official`)
}

/** Éteint l'auto-application sans rien appliquer. */
export async function markReviewedByGestionnaire(moduleId: string): Promise<void> {
    await api.put(`/api/contentmodules/${encodeURIComponent(moduleId)}/marquer-examine`)
}

/**
 * Met le module à la corbeille. Rend `false` sans lever si l'appelant n'a
 * pas le droit : l'interface décide quoi afficher selon le résultat. Les
 * droits sont recalculés côté serveur à partir des rôles réels.
 *
 * isAdminAction/reason — décision prise dans docs/espace-admin-notes-backend.md,
 * section 3 : contourne la vérification "propriétaire ou gestionnaire de
 * CETTE org" quand true, peu importe l'organisation. reason obligatoire
 * dans ce cas, envoyée au serveur (pas juste consignée côté front) —
 * conservée et consultable, visible par la personne dont le contenu a
 * été retiré.
 */
export async function moveModuleToTrash(
    moduleId: string,
    requestingUserId: string,
    isGestionnaireOfThisOrg: boolean,
    isAdminAction?: boolean,
    reason?: string
): Promise<boolean> {
    void requestingUserId
    void isGestionnaireOfThisOrg

    return await apiTolerant(
        async () => {
            await api.put(
                `/api/contentmodules/${encodeURIComponent(moduleId)}/corbeille`,
                { isAdminAction: isAdminAction ?? false, reason: reason ?? undefined },
                // ADMIN_COOKIE explicite UNIQUEMENT pour une action Admin — comportement
                // inchangé pour formateur/gestionnaire (repli automatique habituel).
                isAdminAction ? { cookieName: ADMIN_COOKIE } : undefined
            )
            return true
        },
        false,
    )
}

/** Sort le module de la corbeille. */
export async function restoreModuleFromTrash(moduleId: string): Promise<void> {
    await api.delete(`/api/contentmodules/${encodeURIComponent(moduleId)}/corbeille`)
}

/**
 * Sans effet. La purge des modules expirés est une tâche de fond serveur
 * (`TrashPurgeBackgroundService`). Conservée pour son appelant.
 */
export async function purgeExpiredTrashedModules(): Promise<void> {
}