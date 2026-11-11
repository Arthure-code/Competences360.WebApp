"use server"

import { api, ApiError } from "@/lib/api"

/**
 * Profil personnel — branché sur `PUT /api/users/profile`.
 *
 * Comblait un `// TODO (backend)` de `components/compte/PersonalInfoCard.tsx`,
 * qui n'était qu'un état local : les champs se modifiaient à l'écran, et le
 * moindre rechargement rendait l'ancienne valeur.
 */

export async function mettreAJourMonProfil(input: {
	firstName: string
	lastName: string
	preferredFirstName?: string
}): Promise<{ succes: boolean; erreur?: string }> {
	try {
		await api.put("/api/users/profile", {
			firstName: input.firstName.trim(),
			lastName: input.lastName.trim(),

			// Chaîne vide = prénom d'usage effacé (le front retombe alors sur
			// firstName) ; null voudrait dire « inchangé ». La distinction est
			// portée par le DTO côté API, il ne faut pas l'aplatir ici.
			preferredFirstName: input.preferredFirstName?.trim() ?? "",

			// Volontairement absents : le téléphone et les notifications
			// appartiennent à d'autres écrans, et `null` y signifie « inchangé ».
			phoneNumber: null,
			emailNotifications: null,
		})

		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) return { succes: false, erreur: error.message }
		throw error
	}
}