"use server"

import { api, ApiError } from "@/lib/api"

/**
 * Changement de mot de passe du compte connecté — branché sur
 * `PUT /api/users/password`.
 *
 * L'écran affichait « Modifier mon mot de passe → » sur un `href="#"` : un
 * lien qui ne menait nulle part, alors que la route existait déjà côté API.
 *
 * Le mot de passe actuel est exigé par le serveur. C'est ce qui empêche
 * quelqu'un ayant trouvé une session ouverte — poste non verrouillé, cookie
 * volé — de s'en approprier définitivement le compte en changeant le mot de
 * passe.
 */
export async function changerMonMotDePasse(input: {
	actuel: string
	nouveau: string
	confirmation: string
}): Promise<{ succes: boolean; erreurs?: string[] }> {
	if (input.nouveau !== input.confirmation) {
		return { succes: false, erreurs: ["Les deux nouveaux mots de passe ne correspondent pas."] }
	}

	try {
		await api.put("/api/users/password", {
			currentPassword: input.actuel,
			newPassword: input.nouveau,
			newPasswordConfirm: input.confirmation,
		})

		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) {
			// L'API rend les motifs d'Identity : mot de passe actuel incorrect,
			// règles de complexité non satisfaites… Ce sont eux qui permettent
			// à la personne de corriger sa saisie.
			const motifs = lireMotifs(error)

			return {
				succes: false,
				erreurs: motifs.length > 0
					? motifs
					: ["Le mot de passe n'a pas pu être changé. Vérifiez votre mot de passe actuel."],
			}
		}

		throw error
	}
}

function lireMotifs(error: ApiError): string[] {
	const corps = error.payload as { errors?: unknown } | null | undefined
	const brut = corps?.errors

	if (Array.isArray(brut)) {
		return brut.filter((m): m is string => typeof m === "string")
	}

	// ModelState renvoie un dictionnaire champ -> messages.
	if (brut && typeof brut === "object") {
		return Object.values(brut as Record<string, unknown>)
			.flatMap((v) => (Array.isArray(v) ? v : [v]))
			.filter((m): m is string => typeof m === "string")
	}

	return []
}