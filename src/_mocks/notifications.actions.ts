"use server"

import { api, ApiError } from "@/lib/api"

/**
 * Mutations sur les notifications — séparées de `notifications.mock.ts`
 * (lectures) parce qu'elles sont appelées depuis un composant CLIENT, qui ne
 * peut atteindre le serveur que par une Server Action.
 *
 * Comblait le `// TODO (backend)` de `components/shared/NotificationCenter.tsx` :
 * la lecture n'était qu'un `useState`. On ouvrait le panneau, on marquait
 * tout comme lu, et la pastille revenait au rechargement — avec le même
 * compte de non-lues qu'avant.
 */
export async function marquerNotificationLue(
	notificationId: string,
): Promise<{ succes: boolean }> {
	try {
		await api.put(`/api/notifications/${encodeURIComponent(notificationId)}/lue`)
		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) return { succes: false }
		throw error
	}
}

/**
 * L'API n'a pas de route « tout marquer comme lu » : on boucle. La boucle
 * vit ICI, côté serveur, plutôt que dans le navigateur — un aller-retour par
 * notification depuis le client multiplierait la latence par leur nombre.
 *
 * Les identifiants viennent de la liste déjà affichée, donc du compte
 * connecté ; l'API revérifie de toute façon que chaque notification lui
 * appartient.
 */
export async function marquerToutesLues(
	notificationIds: string[],
): Promise<{ succes: boolean; echecs: number }> {
	const resultats = await Promise.all(
		notificationIds.map((id) => marquerNotificationLue(id)),
	)

	const echecs = resultats.filter((r) => !r.succes).length

	return { succes: echecs === 0, echecs }
}

export async function supprimerNotification(
	notificationId: string,
): Promise<{ succes: boolean }> {
	try {
		await api.delete(`/api/notifications/${encodeURIComponent(notificationId)}`)
		return { succes: true }
	} catch (error) {
		if (error instanceof ApiError) return { succes: false }
		throw error
	}
}