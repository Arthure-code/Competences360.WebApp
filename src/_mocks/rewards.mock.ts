"use server"

import { api, apiTolerant } from "@/lib/api"
import type { Reward } from "@/types/reward"

// Recompenses de l'apprenant connecte, servies par RewardsController.
//
// Badges, certificats et moments forts arrivent dans une seule liste, chacun
// portant son type. Ce sont des recompenses ATTRIBUEES et enregistrees, pas des
// deductions faites a l'affichage : tout client de l'API en recoit les memes.
//
// Rend une liste vide plutot qu'une erreur si l'appel echoue : l'ecran des
// reussites doit s'afficher meme sans elles.
export async function getMyRewards(): Promise<Reward[]> {
    return await apiTolerant(() => api.get<Reward[]>("/api/rewards/mine"), [])
}