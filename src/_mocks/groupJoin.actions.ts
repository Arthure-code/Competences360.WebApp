"use server"

import { api, ApiError, StatutHttp } from "@/lib/api"

export interface ResultatAdhesion {
	succes: boolean
	/** Vrai si la personne était DÉJÀ membre — succès, pas erreur. */
	dejaMembre: boolean
	erreur?: string
}

interface ReponseAdhesion {
	success: boolean
	alreadyMember: boolean
	errorCode?: string
	errorMessage?: string
}

/**
 * Adhésion à un groupe par code de jonction — branché sur
 * `POST /api/groups/rejoindre`.
 *
 * Comblait un `// TODO (backend)` présent dans TROIS écrans
 * (`JoinGroupModal`, `GroupsEmptyState`, et l'étape « code » du formulaire
 * d'inscription). Les trois affichaient « Ce code est invalide ou expiré »
 * **sans appeler quoi que ce soit** : aucun code n'a jamais pu fonctionner,
 * y compris ceux issus des codes QR de groupe que l'API sait générer.
 *
 * La validation du code appartient au serveur, et à lui seul : il retrouve
 * le groupe, vérifie que le code n'a pas expiré et rattache l'apprenant. Le
 * client ne fait que transmettre la saisie.
 *
 * L'opération est idempotente côté API : quelqu'un qui scanne deux fois le
 * même code QR reçoit `alreadyMember`, pas une erreur.
 */
const CODE_REFUSE = "Ce code est invalide ou expiré. Vérifiez avec votre formateur."

const COMPTE_SANS_PROFIL =
	"Votre compte n'est pas un compte apprenant. Demandez à votre formateur de vous inviter."

export async function rejoindreGroupeParCode(code: string): Promise<ResultatAdhesion> {
	const saisie = code.trim()

	if (!saisie) {
		return { succes: false, dejaMembre: false, erreur: "Entrez un code de groupe." }
	}

	try {
		const reponse = await api.post<ReponseAdhesion>("/api/groups/rejoindre", { code: saisie })

		return {
			succes: reponse?.success ?? true,
			dejaMembre: reponse?.alreadyMember ?? false,
			erreur: reponse?.success === false
				? (reponse.errorMessage ?? CODE_REFUSE)
				: undefined,
		}
	} catch (error) {
		if (error instanceof ApiError) {
			// Le 404 porte sur le COMPTE, pas sur le code saisi.
			if (error.status === StatutHttp.Introuvable) {
				return { succes: false, dejaMembre: false, erreur: COMPTE_SANS_PROFIL }
			}

			// Un code inconnu reste vague : comparer les réponses laisserait
			// deviner quels codes existent.
			return {
				succes: false,
				dejaMembre: false,
				erreur: error.status === StatutHttp.RequeteInvalide ? CODE_REFUSE : error.message,
			}
		}

		throw error
	}
}