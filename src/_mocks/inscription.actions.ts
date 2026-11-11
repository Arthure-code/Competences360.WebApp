"use server"

import { api, ApiError } from "@/lib/api"
import { login } from "@/lib/auth"

/**
 * Création d'un compte en libre-service — branché sur
 * `POST /api/auth/register/free`.
 *
 * Comblait un `// TODO (backend)` de `app/(auth)/inscription/page.tsx` :
 * `handleCreateAccount()` ne créait RIEN. Personne ne pouvait s'inscrire
 * seul ; le formulaire enchaînait sur l'étape du code de groupe avec un
 * compte inexistant, et l'étape suivante échouait forcément.
 *
 * Le rôle n'est pas un paramètre : `RegisterFreeAsync` attribue
 * systématiquement `Apprenant` avec `LearnerStatus.Free`. Un client ne
 * choisit pas le rôle qu'on lui accorde — c'est la même règle que pour
 * l'inscription par invitation, où les rôles sont relus de l'invitation.
 *
 * Quelqu'un qui vient inscrire une ORGANISATION passe aussi par ici : il
 * obtient d'abord un compte ordinaire, puis `createOrganizationWithFounder`
 * (`organizations.mock.ts` → `POST /api/organizations/avec-fondateur`) le
 * nomme premier gestionnaire. L'organisation n'est jamais créée par ce
 * formulaire.
 *
 * La connexion suit immédiatement la création, sans quoi l'étape du code de
 * groupe — qui appelle une route authentifiée — ne pourrait pas aboutir.
 */
export async function creerCompteLibre(input: {
	firstName: string
	lastName: string
	email?: string
	phone?: string
	password: string
	confirmPassword: string
}): Promise<{ succes: boolean; erreur?: string }> {
	const courriel = input.email?.trim() || null

	try {
		await api.post("/api/auth/register/free", {
			firstName: input.firstName,
			lastName: input.lastName,
			email: courriel,
			phoneNumber: input.phone?.trim() || null,
			password: input.password,
			passwordConfirm: input.confirmPassword,
		}, { anonymous: true })
	} catch (error) {
		if (error instanceof ApiError) return { succes: false, erreur: error.message }
		throw error
	}

	// Identifiant de connexion : le courriel s'il est fourni, sinon le numéro au format international.
	const identifiant = courriel ?? input.phone ?? ""
	const connexion = await login(identifiant, input.password, true)

	if (!connexion.success) {
		return {
			succes: false,
			erreur: "Votre compte a été créé, mais la connexion automatique a échoué. Connectez-vous depuis la page de connexion.",
		}
	}

	return { succes: true }
}

/**
 * Deuxième temps du parcours « j'inscris mon organisation » : le compte
 * existe et la session est ouverte, on crée l'organisation et son fondateur
 * en devient le premier gestionnaire (`CreateWithFounderAsync`).
 *
 * La reconnexion à la fin n'est pas une précaution de style. Le cookie
 * d'authentification porte les rôles **du moment où il a été émis** — donc
 * `apprenant` seul. Le rôle `gestionnaire` vient d'être accordé côté base,
 * mais la session ne le sait pas, et le garde de `/gestionnaire` renverrait
 * la personne ailleurs. Rouvrir la session réémet le cookie avec le rôle.
 */
export async function creerOrganisationFondatrice(input: {
	nom: string
	identifiant: string
	motDePasse: string
}): Promise<{ succes: boolean; erreur?: string }> {
	try {
		await api.post("/api/organizations/avec-fondateur", { name: input.nom })
	} catch (error) {
		if (error instanceof ApiError) return { succes: false, erreur: error.message }
		throw error
	}

	const connexion = await login(input.identifiant, input.motDePasse, true)

	if (!connexion.success) {
		return {
			succes: false,
			erreur: "L'organisation a été créée, mais la session n'a pas pu être rouverte. Reconnectez-vous.",
		}
	}

	return { succes: true }
}