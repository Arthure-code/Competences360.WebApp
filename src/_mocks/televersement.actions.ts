"use server"

import { api, ApiError } from "@/lib/api"

export type DestinationDepot = "photos" | "exercises"

export interface LienDepot {
	urlDepot: string
	typeContenu: string
	adresse: string
}

/** Demande à l'API un lien signé pour déposer un fichier directement dans le stockage. */
export async function demanderLienDepot(
	destination: DestinationDepot,
	nomFichier: string,
	taille: number,
): Promise<{ lien?: LienDepot; erreur?: string }> {
	try {
		const lien = await api.post<LienDepot>(`/api/uploads/${destination}/lien`, { nomFichier, taille })
		return { lien }
	} catch (error) {
		if (error instanceof ApiError) return { erreur: error.message }
		throw error
	}
}
