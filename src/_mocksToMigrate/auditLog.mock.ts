import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import { routes } from "@/constants/routes"
import type { AuditLogEntry } from "@/types/auditLog"

type EntreeRecue = AuditLogEntry & { targetType?: string; organizationId?: string }

/** Page à consulter pour la cible d'une entrée, si elle en a une. */
function lienDe(entree: EntreeRecue): string | undefined {
    if (entree.actionType === "configuration_modifiee") return routes.admin.reglages
    if (entree.targetType === "administrateur") return routes.admin.administrateurs
    if (entree.targetType === "signalement" && entree.targetId) return routes.admin.signalements.bySlug(entree.targetId)
    if (entree.targetType === "organisation" && entree.targetId) return routes.admin.organisations.bySlug(entree.targetId)
    if (entree.organizationId) return routes.admin.organisations.bySlug(entree.organizationId)
    return undefined
}

/** Lit le journal (GET /api/journal-audit), du plus récent au plus ancien. */
async function lire(requete: string): Promise<AuditLogEntry[]> {
    const entrees = await apiTolerant(
        () => api.get<EntreeRecue[]>(`/api/journal-audit${requete}`, { cookieName: ADMIN_COOKIE }),
        [],
    )

    return entrees.map((entree) => ({ ...entree, targetHref: lienDe(entree) }))
}

/** Plus récent en premier. */
export async function getAllAuditEntries(): Promise<AuditLogEntry[]> {
    return await lire("")
}

/** Recherche par CIBLE — "tout ce qui est arrivé à cette org/ce membre précis", peu importe quel admin a agi. */
export async function getAuditEntriesForTarget(targetId: string): Promise<AuditLogEntry[]> {
    return await lire(`?cible=${encodeURIComponent(targetId)}`)
}

/** Recherche par ACTEUR — "tout ce que cet admin précis a fait". */
export async function getAuditEntriesForActor(actorId: string): Promise<AuditLogEntry[]> {
    return await lire(`?auteur=${encodeURIComponent(actorId)}`)
}
