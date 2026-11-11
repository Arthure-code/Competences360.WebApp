"use client"

import { useState } from "react"
import Link from "next/link"
import LogoPrimary from "@/components/ui/LogoPrimary"
import MiniFooter from "@/components/layout/MiniFooter"
import Button from "@/components/ui/Button"
import StepAccountDetails, { type AccountDetails } from "@/app/(auth)/_components/StepAccountDetails"
import { creerCompteDepuisInvitation } from "@/_mocks/invitationSignup.actions"
import { ROLE_LABELS } from "@/constants/roles"
import { routes } from "@/constants/routes"
import type { Invitation } from "@/types/invitation"
import styles from "./InvitationSignupForm.module.css"

interface InvitationSignupFormProps {
    invitation: Invitation
    organizationName: string
    /** Présent si ce courriel a déjà un compte ailleurs (voir page.tsx, getUserByEmail) — évite d'en créer un 2e en double */
    existingAccount?: { id: string; firstName: string; lastName: string }
}

/**
 * Une seule étape (pas de wizard multi-pages ici) : email déjà connu et
 * verrouillé (StepAccountDetails.emailReadOnly), rôle et organisation déjà
 * déterminés par l'invitation — rien à choisir.
 * existingAccount bascule vers une confirmation d'adhésion plutôt qu'une
 * création de compte — sinon quelqu'un déjà apprenant ailleurs (ou déjà
 * du staff) invité dans une 2e org se retrouverait avec 2 comptes
 * séparés pour la même personne.
 */
export default function InvitationSignupForm({ invitation, organizationName, existingAccount }: InvitationSignupFormProps) {
    const [erreur, setErreur] = useState<string | null>(null)
    const [enCours, setEnCours] = useState(false)
    const [account, setAccount] = useState<AccountDetails>({
        firstName: "",
        lastName: "",
        email: invitation.email,
        phone: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
    })

    const rolesLabel = invitation.roles.map((r) => ROLE_LABELS[r].toLowerCase()).join(" et ")

    /**
     * Le jeton suffit : rôles, organisation et groupes sont relus de
     * l'invitation côté serveur, qui la marque utilisée dans la foulée. Rien
     * de tout cela ne transite par le client — il ne choisit pas le rôle
     * qu'on lui accorde.
     */
    async function handleContinue() {
        setErreur(null)
        setEnCours(true)

        // Sur un succès, l'action redirige vers la connexion depuis le serveur
        // et ne rend pas la main : ce qui suit ne s'exécute que sur un refus.
        const resultat = await creerCompteDepuisInvitation({
            token: invitation.token,
            firstName: account.firstName,
            lastName: account.lastName,
            phone: account.phone,
            password: account.password,
            confirmPassword: account.confirmPassword,
        })

        setErreur(resultat.erreur ?? "La création du compte a échoué.")
        setEnCours(false)
    }

    /**
     * L'application de l'invitation au compte existant se fait sur la page
     * `.../confirmer`, une fois la personne authentifiée : c'est le serveur
     * qui ajoute les rôles, l'organisation et les groupes, et qui vérifie au
     * passage que l'invitation est bien adressée à ce compte.
     *
     * La destination passe par `?apres=`, que le formulaire de connexion
     * honore désormais — il l'ignorait, et la redirection était perdue.
     *
     * Simple lien, pas de navigation programmée : rien n'est modifié au clic.
     * Un lien se précharge, s'ouvre dans un onglet, se copie, et fonctionne
     * même si le script n'a pas encore pris la main.
     */
    const lienConfirmation =
        `${routes.auth.login}?apres=` +
        encodeURIComponent(`/inscription/invitation/${invitation.token}/confirmer`)

    return (
        <div className={styles.page}>
            <div className={styles.imagePanel} />

            <div className={styles.formPanel}>
                <div className={styles.formWrapper}>
                    <LogoPrimary />

                    <p className={styles.context}>
                        Vous rejoignez <strong>{organizationName}</strong> en tant que {rolesLabel}.
                    </p>

                    {existingAccount ? (
                        <div className={styles.existingAccountBox}>
                            <p className={styles.existingAccountText}>
                                Un compte existe déjà pour <strong>{invitation.email}</strong> (
                                {existingAccount.firstName} {existingAccount.lastName}). Connectez-vous pour
                                confirmer votre adhésion à {organizationName} — aucun nouveau compte ne sera créé.
                            </p>
                            <Button label="Se connecter pour confirmer" href={lienConfirmation} fullWidth />
                            <Link href="/mot-de-passe-oublie" className={styles.forgotLink}>
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    ) : (
                        <>
                            {erreur && (
                                <p className={styles.context} role="alert">
                                    {erreur}
                                </p>
                            )}
                            <StepAccountDetails
                                data={account}
                                onChange={setAccount}
                                backHref={routes.auth.login}
                                onContinue={enCours ? () => {} : handleContinue}
                                emailReadOnly
                            />
                        </>
                    )}
                </div>

                <MiniFooter />
            </div>
        </div>
    )
}