"use server"

import { api, ApiError } from "@/lib/api"

/**
 * Correction d'un exercice — branchée sur
 * `POST /api/apprentissage/exercices/cle/{id}/repondre`.
 *
 * C'est le SERVEUR qui décide si la réponse est juste. Le navigateur ne
 * compare plus rien : le catalogue ne porte plus les solutions
 * (`ExerciseConfigSanitizer`), et il ne pourrait pas.
 *
 * Ce déplacement n'est pas qu'une affaire de tricherie. Tant que la
 * correction vivait dans le navigateur, tout client — une application
 * Android, une refonte en Vue — devait la réimplémenter à l'identique, avec
 * ses huit types, sa normalisation des accents, sa règle des deux essais et
 * son barème. Le moindre écart produisait deux apprenants notés
 * différemment pour la même réponse. Désormais l'endpoint rend le verdict,
 * la rétroaction, le score et la bonne réponse : un nouveau client n'a plus
 * qu'à afficher.
 */

export interface ResultatCorrection {
	estCorrect: boolean
	retroaction: string
	actionSuivante: string
	nombreTentatives: number
	score: number
	/** « success » ou « revealed » une fois l'exercice terminé, sinon null. */
	resultat: string | null
	feedbackCorrection: string | null
	/**
	 * Rendue UNIQUEMENT à la finalisation, dans la forme d'une réponse
	 * d'apprenant — donc réaffichable telle quelle par n'importe quel client.
	 */
	bonneReponse: unknown | null
	/** Faux quand le serveur a refusé l'appel (exercice hors de portée…). */
	succes: boolean
	erreur?: string
}

interface ReponseApi {
	estCorrect: boolean
	retroaction: string
	actionSuivante: string
	nombreTentatives: number
	score: number
	resultat: string | null
	feedbackCorrection: string | null
	bonneReponse: unknown | null
}

export async function corrigerExercice(
	exerciceId: string,
	reponse: unknown,
	revealer = false,
): Promise<ResultatCorrection> {
	try {
		const r = await api.post<ReponseApi>(
			`/api/apprentissage/exercices/cle/${encodeURIComponent(exerciceId)}/repondre`,
			{ reponse, reveal: revealer },
		)

		return {
			estCorrect: r?.estCorrect ?? false,
			retroaction: r?.retroaction ?? "",
			actionSuivante: r?.actionSuivante ?? "",
			nombreTentatives: r?.nombreTentatives ?? 0,
			score: r?.score ?? 0,
			resultat: r?.resultat ?? null,
			feedbackCorrection: r?.feedbackCorrection ?? null,
			bonneReponse: r?.bonneReponse ?? null,
			succes: true,
		}
	} catch (error) {
		if (error instanceof ApiError) {
			// Le refus n'est PAS un échec de l'apprenant : ne rien finaliser,
			// ne rien compter. Il pourra réessayer.
			return {
				estCorrect: false,
				retroaction: "",
				actionSuivante: "",
				nombreTentatives: 0,
				score: 0,
				resultat: null,
				feedbackCorrection: null,
				bonneReponse: null,
				succes: false,
				erreur: messageLisible(error),
			}
		}

		throw error
	}
}

/**
 * Le message d'une ApiError porte la méthode et l'URL — utile dans un journal,
 * pas devant un apprenant, à qui il montrait
 * « POST /api/apprentissage/exercices/cle/… — Cet exercice est déjà terminé. ».
 * On préfère le `detail` du ProblemDetails, qui est la phrase rédigée pour
 * lui ; le reste ne sort pas du serveur.
 */
function messageLisible(error: ApiError): string {
	const detail = (error.payload as { detail?: string } | undefined)?.detail

	return detail?.trim() || "La réponse n'a pas pu être envoyée. Réessayez."
}