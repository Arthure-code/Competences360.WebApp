import { notFound, redirect } from "next/navigation"
import { getInvitationByToken } from "@/_mocks/invitations.mock"
import { hasSessionCookie } from "@/lib/auth"
import { landingPathForCurrentSession } from "@/_mocks/session.actions"
import { accepterInvitationAvecMonCompte } from "@/_mocks/invitationAcceptation.actions"
import ConfirmationAdhesion from "@/app/(auth)/_components/ConfirmationAdhesion"

interface ConfirmerPageProps {
	params: Promise<{ token: string }>
}

/**
 * Destination de « Se connecter pour confirmer », pour quelqu'un qui possède
 * déjà un compte et se voit invité ailleurs.
 *
 * Cette route **n'existait pas** : le bouton envoyait vers
 * `/connexion?apres=/inscription/invitation/{token}/confirmer`, et la
 * personne, une fois connectée, tombait sur « Page introuvable ». Même
 * catégorie de défaut que l'ancien lien `/rejoindre?token=`.
 *
 * L'acceptation est faite ICI, au rendu serveur, et non derrière un bouton :
 * la personne a déjà confirmé son intention à l'écran précédent, puis prouvé
 * son identité en se connectant. Lui redemander de cliquer n'ajouterait
 * aucune garantie.
 */
export default async function ConfirmerAdhesionPage({ params }: ConfirmerPageProps) {
	const { token } = await params

	const invitation = await getInvitationByToken(token)
	if (!invitation) notFound()

	// Pas encore connecté : on repasse par le formulaire, qui revient ici.
	if (!(await hasSessionCookie())) {
		redirect(`/connexion?apres=${encodeURIComponent(`/inscription/invitation/${token}/confirmer`)}`)
	}

	const resultat = await accepterInvitationAvecMonCompte(token)

	if (!resultat.succes) {
		return <ConfirmationAdhesion erreur={resultat.erreur ?? "Cette invitation n'a pas pu être appliquée."} />
	}

	// Les rôles viennent de changer : la cible dépend du nouveau, pas de
	// l'ancien.
	redirect(await landingPathForCurrentSession())
}