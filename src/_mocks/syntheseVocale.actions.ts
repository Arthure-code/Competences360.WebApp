"use server"

import { api, ApiError } from "@/lib/api"

interface AudioSynthese {
	url: string
}

// Rend l'URL de la lecture a voix haute d'un texte, ou une chaine vide quand le
// serveur refuse.
//
// La route est ouverte sans session, le bouton devant fonctionner sur les cours
// publics comme sur les cours prives. Elle passe quand meme par une Server
// Action : le navigateur n'a aucun acces direct a l'API.
//
// Un refus rend une chaine vide plutot qu'une erreur. La lecture est une aide
// facultative : qu'elle echoue ne doit pas interrompre l'exercice en cours.
export async function lireAVoixHaute(texte: string, langue?: string): Promise<string> {
	if (!texte.trim()) {
		return ""
	}

	try {
		const audio = await api.post<AudioSynthese>("/api/synthese-vocale", { texte, langue })
		return audio.url
	} catch (error) {
		if (error instanceof ApiError) {
			return ""
		}

		throw error
	}
}