"use server"

import { api, apiTolerant } from "@/lib/api"
import type { TableauBordGestionnaire } from "@/types/gestionnaireDashboard"

const TABLEAU_BORD_VIDE: TableauBordGestionnaire = {
	nombreModulesAReviser: 0,
	nombreGroupes: 0,
	nombreMembres: 0,
	progressionMoyennePourcent: 0,
	nombreInvitationsEnAttente: 0,
	groupes: [],
	groupesStagnants: [],
	modulesNonAssignes: [],
	contenuOrphelin: [],
	repartitionRoles: { apprenant: 0, formateur: 0, gestionnaire: 0 },
}

/**
 * Écran d'accueil du gestionnaire, composé par l'API en une seule requête.
 *
 * L'organisation vient du compte connecté, jamais de l'appelant. Rend un
 * tableau de bord vide quand le compte n'est rattaché à aucune organisation :
 * la page s'affiche alors avec ses compteurs à zéro plutôt qu'en erreur.
 */
export async function getTableauBordGestionnaire(): Promise<TableauBordGestionnaire> {
	return await apiTolerant(
		() => api.get<TableauBordGestionnaire>("/api/gestionnaire/accueil"),
		TABLEAU_BORD_VIDE,
	)
}