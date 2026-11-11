"use server"

import { api, apiTolerant } from "@/lib/api"
import { assertCompteConnecte } from "@/_mocks/users.mock"
import type { Assignment } from "@/types/assignment"

/**
 * Lectures sur Assignment, branchées sur AssignmentsController.
 */

export async function getAssignmentsForVersion(versionId: string): Promise<Assignment[]> {
    return await apiTolerant(
        () => api.get<Assignment[]>(`/api/assignments/version/${encodeURIComponent(versionId)}`),
        [],
    )
}

/**
 * true si quelqu'un D'AUTRE que le créateur a assigné cette version —
 * l'éditeur bloque alors la modification en place, le contenu circulant
 * déjà chez les apprenants d'un collègue.
 */
export async function isVersionAssignedByOthers(versionId: string, creatorUserId: string): Promise<boolean> {
    return await apiTolerant(
        () => api.get<boolean>(
            `/api/assignments/version/${encodeURIComponent(versionId)}`
            + `/assignee-par-autrui/${encodeURIComponent(creatorUserId)}`),
        false,
    )
}

/** Assignations créées par le formateur connecté, plus récentes en premier. */
export async function getAssignmentsByFormateur(userId: string): Promise<Assignment[]> {
    await assertCompteConnecte(userId, "getAssignmentsByFormateur")

    return await apiTolerant(
        () => api.get<Assignment[]>("/api/assignments/moi"),
        [],
    )
}

/** Toutes les assignations de l'organisation, tous formateurs confondus — vue gestionnaire. */
export async function getAssignmentsForOrganization(organizationId: string): Promise<Assignment[]> {
    return await apiTolerant(
        () => api.get<Assignment[]>(
            `/api/assignments/organisation/${encodeURIComponent(organizationId)}`),
        [],
    )
}

export async function getAssignmentsForGroup(groupId: string): Promise<Assignment[]> {
    return await apiTolerant(
        () => api.get<Assignment[]>(`/api/assignments/groupe/${encodeURIComponent(groupId)}`),
        [],
    )
}

/**
 * Toutes les assignations qui visent ce module de contenu, quelle que soit
 * la version — y compris celles qui suivent l'officielle du moment.
 *
 * Distinct de getAssignmentsForVersion, qui ne rend que les assignations
 * épinglées sur une version précise : une assignation sans version n'y
 * figure pas, alors qu'elle couvre bel et bien le module.
 */
export async function getAssignmentsForContentModule(moduleId: string): Promise<Assignment[]> {
    return await apiTolerant(
        () => api.get<Assignment[]>(
            `/api/assignments/module-contenu/${encodeURIComponent(moduleId)}`),
        [],
    )
}

/**
 * Variante en lot : un seul aller-retour pour toute une liste de modules.
 * Un identifiant hors de portée est absent de la réponse, donc rendu avec
 * une liste vide, exactement ce que rendait la lecture unitaire.
 */
export async function getAssignmentsForContentModules(moduleIds: string[]): Promise<Map<string, Assignment[]>> {
    if (moduleIds.length === 0) return new Map()

    const lignes = await apiTolerant(
        () => api.post<{ contentModuleId: string; assignments: Assignment[] }[]>(
            "/api/assignments/module-contenu/lot",
            { contentModuleIds: moduleIds.map(Number) }),
        [],
    )

    return new Map(lignes.map((ligne) => [String(ligne.contentModuleId), ligne.assignments]))
}

/**
 * Où vit une activité — son module, sa version, son titre.
 *
 * Nécessaire parce qu'une assignation ciblant une activité ne porte que
 * l'id du niveau, jamais celui de son module. La recherche traverse le
 * contenu des versions publiées de l'organisation ; elle est faite côté
 * serveur, seul endroit où ce contenu est intégralement disponible.
 *
 * Était synchrone du temps du mock, le tableau étant en mémoire. Elle est
 * désormais asynchrone comme tout le reste.
 */
export async function findModuleForNiveau(
    niveauId: string,
    versionId?: string
): Promise<{ moduleId: string; versionId: string; niveauTitle: string } | undefined> {
    const query = versionId ? `?versionId=${encodeURIComponent(versionId)}` : ""

    const localisation = await apiTolerant(
        () => api.get<{ moduleId: string; versionId: string; niveauTitle: string } | null>(
            `/api/contentmodules/niveaux/${encodeURIComponent(niveauId)}${query}`),
        null,
    )

    return localisation ?? undefined
}

export interface ResolvedAssignment {
    moduleId: string
    /** Absent = la version officielle courante du module au moment de la résolution (voir types/assignment.ts) */
    versionId?: string
    /** Échéance du MODULE entier — absente si seule une activité précise de ce module a une échéance (voir niveauDueDates) */
    dueDate?: string
    source: "apprenant" | "group"
    /** Auteur de l'assignation gagnante — pour afficher « assigné par X » sans second aller-retour. */
    assignedByUserId: string
    /**
     * Échéances propres à UNE activité précise du module, indexées par
     * identifiant de niveau, indépendantes de dueDate qui couvre le module
     * entier. Une activité présente ici a sa PROPRE échéance — le scénario
     * du rattrapage ciblé.
     */
    niveauDueDates?: Record<string, string>
}

/**
 * Une entrée résolue par module. La règle de priorité est appliquée par
 * l'API : l'assignation individuelle l'emporte sur celle d'un groupe (plus
 * spécifique) ; à égalité de type, la plus récemment assignée gagne.
 *
 * `userId` EST transmis, contrairement à la plupart des lectures de ce
 * dossier. Ce n'est pas une exception au principe « le serveur répond pour
 * le compte connecté », c'est le cas où cette route sert aussi à autre
 * chose : le dossier d'un apprenant consulté par un formateur ou un
 * gestionnaire. Tant qu'elle répondait pour l'appelant, ce dossier
 * affichait les modules de son lecteur, donc aucun. L'API décide qui a le
 * droit de lire quoi ; le paramètre est une demande, pas une autorisation.
 *
 * apprenantGroupIds reste dans la signature pour ne pas toucher aux
 * appelants : le serveur retrouve lui-même les groupes de l'apprenant.
 */
export async function getResolvedAssignmentsForApprenant(
    userId: string,
    apprenantGroupIds: string[]
): Promise<ResolvedAssignment[]> {
    void apprenantGroupIds

    return await apiTolerant(
        () => api.get<ResolvedAssignment[]>(
            `/api/resolvedassignments/apprenant/${encodeURIComponent(userId)}`),
        [],
    )
}

/**
 * Symétrique pour un groupe entier — pas de règle « individuel bat groupe »
 * ici (tout vient du même groupe), juste « le plus récent gagne ». Résout
 * aussi les activités précises assignées à tout un groupe, pas seulement
 * les modules entiers.
 */
export async function getResolvedAssignmentsForGroup(groupId: string): Promise<ResolvedAssignment[]> {
    return await apiTolerant(
        () => api.get<ResolvedAssignment[]>(
            `/api/resolvedassignments/groupe/${encodeURIComponent(groupId)}`),
        [],
    )
}