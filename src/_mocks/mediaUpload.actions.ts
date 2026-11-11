import { demanderLienDepot, type DestinationDepot } from "@/_mocks/televersement.actions"

const ECHEC_ENVOI = "L'envoi du fichier a échoué. Vérifiez votre connexion et réessayez."

/** Dépose un fichier directement dans le stockage par un lien signé et rend son adresse. */
export async function deposerFichier(
	fichier: File,
	destination: DestinationDepot,
): Promise<{ succes: boolean; url?: string; erreur?: string }> {
	const demande = await demanderLienDepot(destination, fichier.name, fichier.size)
	if (!demande.lien) return { succes: false, erreur: demande.erreur }

	const envoi = await fetch(demande.lien.urlDepot, {
		method: "PUT",
		headers: { "Content-Type": demande.lien.typeContenu },
		body: fichier,
	}).catch(() => null)

	if (!envoi?.ok) return { succes: false, erreur: ECHEC_ENVOI }

	return { succes: true, url: demande.lien.adresse }
}

/** Dépose un média d'exercice (image, vidéo ou audio) et rend son adresse. */
export async function televerserMedia(form: FormData): Promise<{ succes: boolean; url?: string; erreur?: string }> {
	return deposerFichier(form.get("file") as File, "exercises")
}

/** Dépose la photo de profil du compte connecté et rend son chemin. */
export async function televerserMaPhoto(form: FormData): Promise<{ succes: boolean; chemin?: string; erreur?: string }> {
	const depot = await deposerFichier(form.get("file") as File, "photos")
	return { succes: depot.succes, chemin: depot.url, erreur: depot.erreur }
}
