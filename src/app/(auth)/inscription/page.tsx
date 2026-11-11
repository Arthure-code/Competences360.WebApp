"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import LogoPrimary from "@/components/ui/LogoPrimary"
import MiniFooter from "@/components/layout/MiniFooter"
import ProgressBar from "@/components/ui/ProgressBar"
import StepRoleSelect, { type UserRole } from "@/app/(auth)/_components/StepRoleSelect"
import StepAccountDetails, { type AccountDetails } from "@/app/(auth)/_components/StepAccountDetails"
import StepGroupCode, { type GroupCodeTab } from "@/app/(auth)/_components/StepGroupCode"
import StepOrganizationSearch from "@/app/(auth)/_components/StepOrganizationSearch"
import StepInviteOnly from "@/app/(auth)/_components/StepInviteOnly"
import { creerCompteLibre, creerOrganisationFondatrice } from "@/_mocks/inscription.actions"
import { rejoindreGroupeParCode } from "@/_mocks/groupJoin.actions"
import { allerVersMonEspace } from "@/_mocks/session.actions"
import type { Organization } from "@/types/organization"
import styles from "./page.module.css"

/**
 * Plus un ordre fixe (STEP_ORDER) — la séquence dépend du rôle choisi :
 * - apprenant : role -> account -> group (inchangé)
 * - formateur : role -> inviteOnly (cul-de-sac, doit être invité)
 * - organisation : role -> orgSearch -> (org trouvée -> inviteOnly) | (introuvable -> account)
 *   (le choix UI "organisation" devient le rôle de compte "gestionnaire" une fois créé)
 * Un vrai lien d'invitation (formateur/gestionnaire) passe par une route
 * séparée (/inscription/invitation/[token]), pas ce wizard.
 */
type StepKey = "role" | "orgSearch" | "inviteOnly" | "account" | "group"

const EMPTY_ACCOUNT: AccountDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
}

// Pas de fraction exacte "étape N sur M" possible ici (la séquence branche
// selon le rôle) — valeur indicative croissante plutôt qu'un vrai calcul.
const PROGRESS_BY_STEP: Record<StepKey, number> = {
    role: 25,
    orgSearch: 50,
    inviteOnly: 75,
    account: 75,
    group: 100,
}

export default function Inscription() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState<StepKey>("role")
    const [accountError, setAccountError] = useState<string | null>(null)
    const [enCours, setEnCours] = useState(false)
    const [role, setRole] = useState<UserRole | null>(null)
    const [account, setAccount] = useState<AccountDetails>(EMPTY_ACCOUNT)
    const [groupTab, setGroupTab] = useState<GroupCodeTab>("code")
    const [groupCode, setGroupCode] = useState("")
    const [groupCodeError, setGroupCodeError] = useState<string | null>(null)
    const [foundOrganization, setFoundOrganization] = useState<Organization | null>(null)
    /** Le nom cherché sans résultat : c'est celui de l'organisation à créer. */
    const [organizationName, setOrganizationName] = useState("")

    function handleRoleContinue() {
        if (role === "apprenant") setCurrentStep("account")
        else if (role === "formateur") setCurrentStep("inviteOnly")
        else if (role === "organisation") setCurrentStep("orgSearch")
    }

    function handleOrganizationFound(organization: Organization) {
        setFoundOrganization(organization)
        setCurrentStep("inviteOnly")
    }

    function handleOrganizationNotFound(nomRecherche: string) {
        setFoundOrganization(null)
        setOrganizationName(nomRecherche)
        setCurrentStep("account")
    }

    function handleBackToRole() {
        setCurrentStep("role")
    }

    /**
     * L'API n'accorde qu'un rôle à une inscription libre : `Apprenant`, en
     * statut `Free`. Le rôle choisi dans ce formulaire n'est pas envoyé — il
     * ne décide que de la SUITE du parcours ici. Laisser le client nommer son
     * propre rôle serait une porte ouverte.
     */
    async function handleCreateAccount() {
        setAccountError(null)
        setEnCours(true)

        const creation = await creerCompteLibre({
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            phone: account.phone,
            password: account.password,
            confirmPassword: account.confirmPassword,
        })

        if (!creation.succes) {
            setAccountError(creation.erreur ?? "La création du compte a échoué.")
            setEnCours(false)
            return
        }

        // Apprenant : l'étape du code de groupe suit, et la session est déjà
        // ouverte — sans quoi l'adhésion, qui est authentifiée, échouerait.
        if (role === "apprenant") {
            setEnCours(false)
            setCurrentStep("group")
            return
        }

        // Organisation : c'est sa création qui nomme le fondateur
        // gestionnaire, pas l'inscription.
        const organisation = await creerOrganisationFondatrice({
            nom: organizationName,
            identifiant: account.email.trim() || account.phone,
            motDePasse: account.password,
        })

        if (!organisation.succes) {
            setAccountError(organisation.erreur ?? "La création de l'organisation a échoué.")
            setEnCours(false)
            return
        }

        await allerAuTableauDeBord()
    }

    async function handleGroupCodeSubmit() {
        // Le code est facultatif : un apprenant libre peut découvrir le
        // catalogue sans appartenir à aucun groupe.
        if (!groupCode.trim()) {
            await allerAuTableauDeBord()
            return
        }

        setEnCours(true)
        const adhesion = await rejoindreGroupeParCode(groupCode)

        if (!adhesion.succes) {
            setGroupCodeError(adhesion.erreur ?? "Ce code est invalide ou expiré. Vérifiez avec votre formateur.")
            setEnCours(false)
            return
        }

        await allerAuTableauDeBord()
    }

    /**
     * La navigation est faite par le serveur, dans l'action : la session vient
     * d'être ouverte — ou rouverte avec un rôle de plus — et c'est ce qui
     * invalide le cache du routeur, où dort encore l'état « déconnecté » de la
     * cible. Même raison qu'au formulaire de connexion.
     */
    async function allerAuTableauDeBord() {
        await allerVersMonEspace()
    }

    const inviteOnlyMessage =
        role === "formateur"
            ? "Vous devez être invité par votre organisation. Contactez votre gestionnaire pour recevoir un lien d'invitation."
            : foundOrganization
              ? `${foundOrganization.name} est déjà inscrite. Contactez un gestionnaire de cette organisation pour recevoir un lien d'invitation.`
              : "Vous devez être invité par un gestionnaire déjà en place."

    const stepRenderers: Record<StepKey, () => ReactNode> = {
        role: () => <StepRoleSelect value={role} onChange={setRole} onContinue={handleRoleContinue} />,
        orgSearch: () => (
            <StepOrganizationSearch
                onBack={handleBackToRole}
                onOrganizationFound={handleOrganizationFound}
                onOrganizationNotFound={handleOrganizationNotFound}
            />
        ),
        inviteOnly: () => <StepInviteOnly message={inviteOnlyMessage} onBack={handleBackToRole} />,
        account: () => (
            <>
                {accountError && (
                    <p className={styles.formError} role="alert">
                        {accountError}
                    </p>
                )}
                <StepAccountDetails
                    data={account}
                    onChange={setAccount}
                    onBack={role === "organisation" ? () => setCurrentStep("orgSearch") : handleBackToRole}
                    onContinue={enCours ? () => {} : handleCreateAccount}
                />
            </>
        ),
        group: () => (
            <StepGroupCode
                activeTab={groupTab}
                onTabChange={setGroupTab}
                code={groupCode}
                onCodeChange={(value) => {
                    setGroupCode(value)
                    setGroupCodeError(null)
                }}
                error={groupCodeError}
                onBack={() => setCurrentStep("account")}
                onSubmit={enCours ? () => {} : handleGroupCodeSubmit}
            />
        ),
    }

    return (
        <div className={styles.page}>
            <div className={styles.imagePanel} />

            <div className={styles.formPanel}>
                <div className={styles.formWrapper}>
                    <LogoPrimary />
                    <ProgressBar value={PROGRESS_BY_STEP[currentStep]} ariaLabel="Progression de l'inscription" />

                    {stepRenderers[currentStep]()}
                </div>

                <MiniFooter />
            </div>
        </div>
    )
}