"use server"

import { api, apiTolerant } from "@/lib/api"
import type { AnonymizedProgressEntry } from "@/types/anonymizedProgress"

/**
 * Contribution anonymisée des anciens membres d'un groupe, sous forme
 * (groupe, mois, pourcentage). Alimente les moyennes du groupe sans exposer
 * personne.
 *
 * Ces lignes sont écrites par la tâche de rétention côté serveur, trente
 * jours après un départ ou une demande de suppression.
 */
export async function getAnonymizedProgressForGroup(
    groupId: string
): Promise<AnonymizedProgressEntry[]> {
    return await apiTolerant(
        () => api.get<AnonymizedProgressEntry[]>(
            `/api/groups/${encodeURIComponent(groupId)}/progression-anonymisee`),
        [],
    )
}