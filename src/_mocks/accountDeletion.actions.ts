"use server"

import { redirect } from "next/navigation"
import { api, ApiError, StatutHttp } from "@/lib/api"
import { logout } from "@/lib/auth"
import { routes } from "@/constants/routes"

/**
 * Suppression IMMÉDIATE du compte — branché sur `DELETE /api/users`.
 *
 * Comblait un `// TODO (backend)` de `components/compte/DangerZoneCard.tsx` :
 * `handleConfirmImmediate()` se contentait de fermer la fenêtre. La personne
 * confirmait la suppression de son compte, la fenêtre se refermait, et rien
 * n'était supprimé — l'illusion d'une suppression est pire qu'un bouton
 * absent.
 *
 * Ce chemin est réservé aux **apprenants libres**, et c'est l'API qui le fait
 * respecter (`[Authorize(Roles = "Apprenant")]` + `LearnerStatus.Free`) : un
 * apprenant en formation, un formateur ou un gestionnaire passe par une
 * DEMANDE soumise à approbation (`submitDeletionRequest`). Le front n'est pas
 * l'arbitre de cette distinction, il ne fait que présenter le bon écran.
 *
 * La session est fermée dans la foulée : garder un cookie qui désigne un
 * compte disparu ne mènerait qu'à des 401 sur l'écran suivant.
 */
export async function supprimerMonCompte(): Promise<{ succes: boolean; erreur?: string }> {
	try {
		await api.delete("/api/users")
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				succes: false,
				erreur: error.status === StatutHttp.Interdit
					? "Votre compte ne peut pas être supprimé directement. Déposez une demande de suppression."
					: error.message,
			}
		}

		throw error
	}

	await logout()

	// La redirection part du serveur, dans la foulée de la fermeture de
	// session : le cache du routeur client garde sinon les pages d'un compte
	// qui n'existe plus. redirect() ne rend jamais la main, d'où le type de
	// retour ci-dessous — l'appelant n'a rien à faire du succès.
	redirect(routes.auth.login)
}