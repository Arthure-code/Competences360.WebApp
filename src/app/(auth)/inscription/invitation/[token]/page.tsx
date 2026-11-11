import Link from "next/link"
import { routes } from "@/constants/routes"
import {
    getInvitationAvecOrganisation,
    getMotifInvitationRefusee,
    type MotifInvitationRefusee,
} from "@/_mocks/invitations.mock"
import { getUserByEmail } from "@/_mocks/users.mock"
import InvitationSignupForm from "@/app/(auth)/_components/InvitationSignupForm"
import styles from "./page.module.css"

interface InvitationSignupPageProps {
    params: Promise<{ token: string }>
}

/**
 * Route séparée du wizard /inscription — un vrai lien reçu (formateur ou
 * gestionnaire invité par un autre gestionnaire) saute StepRoleSelect
 * entièrement : rôle et organisation déjà déterminés par l'invitation.
 *
 * getUserByEmail vérifie si ce courriel a déjà un compte ailleurs (ex.
 * déjà apprenant dans une autre org, ou déjà membre du staff) — dans ce
 * cas, InvitationSignupForm affiche une confirmation d'adhésion plutôt
 * que de créer un compte en double.
 */
export default async function InvitationSignupPage({ params }: InvitationSignupPageProps) {
    const { token } = await params
    const contexte = await getInvitationAvecOrganisation(token)

    if (!contexte) {
        return <LienInutilisable motif={await getMotifInvitationRefusee(token)} />
    }

    const { invitation, organizationName } = contexte
    const existingAccount = await getUserByEmail(invitation.email)

    return (
        <InvitationSignupForm
            invitation={invitation}
            organizationName={organizationName}
            existingAccount={existingAccount}
        />
    )
}
/**
 * Un lien d'invitation qui ne mène nulle part doit DIRE pourquoi.
 *
 * Cette page affichait « Une erreur est survenue » — la page d'erreur
 * générique — parce que la route de validation répondait 400 sur un jeton
 * déjà consommé, et que ce code n'était pas toléré. C'était le premier écran
 * que voyait une personne invitée cliquant deux fois sur son lien.
 *
 * Chaque motif appelle un geste différent, et c'est tout l'intérêt de les
 * distinguer : se connecter, redemander un lien, ou vérifier l'adresse.
 */
function LienInutilisable({ motif }: { motif: MotifInvitationRefusee | null }) {
    const messages: Record<MotifInvitationRefusee, { titre: string; texte: string }> = {
        dejaUtilisee: {
            titre: "Cette invitation a déjà servi",
            texte: "Votre compte existe : connectez-vous avec l'adresse qui a reçu ce courriel.",
        },
        expiree: {
            titre: "Cette invitation a expiré",
            texte: "Demandez à la personne qui vous a invité de vous en envoyer une nouvelle.",
        },
        introuvable: {
            titre: "Ce lien d'invitation n'est pas reconnu",
            texte: "Vérifiez que vous avez copié l'adresse en entier, ou demandez un nouveau lien.",
        },
    }

    const { titre, texte } = messages[motif ?? "introuvable"]

    return (
        <main className={styles.page}>
            <h1>{titre}</h1>
            <p>{texte}</p>
            <Link href={routes.auth.login}>Aller à la connexion</Link>
        </main>
    )
}