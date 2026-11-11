"use server"

import { api, apiTolerant } from "@/lib/api"
import type { NiveauProgressSnapshot } from "@/lib/progressStorage"

/**
 * Les trois Server Actions derrière apiProgressStorage
 * (lib/progressStorage.ts) — load/save/clear, branchées sur
 * ProgressController.
 *
 * Elles vivent ici parce que useNiveauProgress est un hook CLIENT : il ne
 * peut pas appeler lib/api.ts, qui lit le cookie de session côté serveur.
 * Un fichier à part avec "use server" en tête, comme partout ailleurs dans
 * ce projet.
 *
 * L'identifiant de l'apprenant n'apparaît nulle part : l'API répond pour le
 * compte authentifié. C'est ce qui empêche un navigateur de lire, ou pire
 * d'écraser, la progression de quelqu'un d'autre en changeant une clé.
 */

export async function loadNiveauProgress(
    niveauId: string
): Promise<NiveauProgressSnapshot | null> {
    return await apiTolerant(
        () => api.get<NiveauProgressSnapshot | null>(
            `/api/progress/${encodeURIComponent(niveauId)}`),
        null,
    )
}

/**
 * Plusieurs activités en un seul aller-retour.
 *
 * Sans elle, une page de parcours qui affiche six modules de six activités
 * déclenchait trente-six Server Actions — chacune étant une requête HTTP à
 * part entière. Le coût était invisible du temps du localStorage ; il ne
 * l'est plus.
 *
 * Une activité absente de la réponse n'a jamais été commencée.
 */
export async function loadManyNiveauProgress(
    niveauIds: string[]
): Promise<Record<string, NiveauProgressSnapshot>> {
    if (niveauIds.length === 0) return {}

    return await apiTolerant(
        () => api.post<Record<string, NiveauProgressSnapshot>>(
            "/api/progress/lot", niveauIds),
        {},
    )
}

/**
 * Tolérante au refus : une sauvegarde perdue ne doit jamais interrompre
 * l'apprenant en plein exercice. L'état reste en mémoire dans le hook, la
 * sauvegarde suivante rattrapera.
 */
export async function saveNiveauProgress(
    niveauId: string,
    snapshot: NiveauProgressSnapshot
): Promise<void> {
    await apiTolerant(
        () => api.put(`/api/progress/${encodeURIComponent(niveauId)}`, snapshot),
        null,
    )
}

export async function clearNiveauProgress(niveauId: string): Promise<void> {
    await apiTolerant(
        () => api.delete(`/api/progress/${encodeURIComponent(niveauId)}`),
        null,
    )
}