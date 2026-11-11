"use server"

import { redirect } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { routes } from "@/constants/routes"

/**
 * Création d'un compte à partir d'une invitation — branché sur
 * `POST /api/auth/register/invited`.
 *
 * Comblait un `// TODO (backend)` laissé par l'équipe front dans
 * `InvitationSignupForm.handleContinue`, qui était une fonction VIDE : le
 * bouton « Créer mon compte » ne faisait rien du tout, la page restait figée
 * sans le moindre message. Toute personne invitée était bloquée là.
 *
 * Le jeton porte à lui seul les rôles, l'organisation et les groupes : rien
 * de tout cela n'est envoyé par le client. C'est le serveur qui relit
 * l'invitation, applique ce qu'elle contient et la marque utilisée.
 */
export async function creerCompteDepuisInvitation(input: {
    token: string
    firstName: string
    lastName: string
    phone?: string
    password: string
    confirmPassword: string
}): Promise<{ succes: boolean; erreur?: string }> {
    try {
        await api.post("/api/auth/register/invited", {
            token: input.token,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phone || null,
            password: input.password,
            passwordConfirm: input.confirmPassword,
        }, { anonymous: true })
    } catch (error) {
        if (error instanceof ApiError) {
            return { succes: false, erreur: error.message }
        }
        throw error
    }

    // Le compte est créé mais pas encore connecté : on passe par la connexion,
    // qui pose le cookie et oriente selon le rôle. La navigation part de
    // l'action — seule forme qui invalide le cache du routeur en même temps
    // qu'elle redirige — donc rien n'est rendu sur un succès.
    redirect(routes.auth.login)
}