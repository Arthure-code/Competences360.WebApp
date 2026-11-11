"use server"

import { api, ApiError, apiTolerant, StatutHttp } from "@/lib/api"

export interface Preferences {
	emailNotifications: boolean
	smsNotifications: boolean
	preferredLanguage: string
}

const REPLI: Preferences = {
	emailNotifications: true,
	smsNotifications: false,
	preferredLanguage: "fr",
}

/**
 * Préférences du compte — branché sur `GET` et `PUT /api/preferences`.
 *
 * Comblait le `// TODO (backend)` de `components/parametres/LanguageCard.tsx`,
 * dont le sélecteur n'était qu'un `useState` : la langue changeait à l'écran
 * et revenait au rechargement.
 *
 * Lecture ET écriture dans un module d'actions, contrairement à la règle
 * `.mock` = lectures : l'appelant est un composant CLIENT, qui ne peut
 * atteindre le serveur que par une Server Action.
 */
export async function lireMesPreferences(): Promise<Preferences> {
	return await apiTolerant(() => api.get<Preferences>("/api/preferences"), REPLI)
}

/**
 * `PUT /api/preferences` remplace les TROIS champs d'un coup. Envoyer la
 * seule langue remettrait les notifications à leur valeur par défaut — d'où
 * la relecture préalable. La liste des langues acceptées est fermée côté
 * serveur ; un code inconnu ressort en 400.
 */
export async function changerMaLangue(
	langue: string,
): Promise<{ succes: boolean; erreur?: string }> {
	const actuelles = await lireMesPreferences()

	try {
		await api.put("/api/preferences", {
			emailNotifications: actuelles.emailNotifications,
			smsNotifications: actuelles.smsNotifications,
			preferredLanguage: langue,
		})

		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				succes: false,
				erreur: error.status === StatutHttp.RequeteInvalide
					? "Cette langue n'est pas prise en charge."
					: error.message,
			}
		}

		throw error
	}
}