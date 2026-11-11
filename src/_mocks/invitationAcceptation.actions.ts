"use server"

import { api, ApiError, StatutHttp } from "@/lib/api"

/**
 * Application d'une invitation à un compte DÉJÀ existant — branché sur
 * `POST /api/auth/invitations/accepter`.
 *
 * Comblait le `// TODO (backend)` de
 * `InvitationSignupForm.handleConfirmExistingAccount`. La personne déjà
 * titulaire d'un compte, invitée dans une deuxième organisation, était
 * envoyée vers une page de confirmation **qui n'existait pas** : encore un
 * lien vers du vide, comme l'ancien `/rejoindre?token=`.
 *
 * Seul le jeton part. Rôles, organisation et groupes sont relus de
 * l'invitation côté serveur, qui vérifie de surcroît qu'elle est bien
 * adressée à l'adresse du compte connecté : détenir un jeton — il circule
 * par courriel et par code QR — ne prouve pas qu'on en est le destinataire.
 */
export async function accepterInvitationAvecMonCompte(
	token: string,
): Promise<{ succes: boolean; erreur?: string }> {
	try {
		await api.post("/api/auth/invitations/accepter", { token })
		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				succes: false,
				erreur: error.status === StatutHttp.RequeteInvalide
					? "Cette invitation n'est plus valide, ou elle ne correspond pas à votre compte."
					: error.message,
			}
		}

		throw error
	}
}