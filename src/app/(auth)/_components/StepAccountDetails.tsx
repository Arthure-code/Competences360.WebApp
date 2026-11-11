"use client"

import { useState } from "react"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Input from "../../../components/ui/Input"
import PhoneInput from "../../../components/ui/PhoneInput"
import Checkbox from "../../../components/ui/Checkbox"
import PasswordRules, { isPasswordValid } from "./PasswordRules"
import StepShell from "./StepShell"
import styles from "./StepAccountDetails.module.css"

export interface AccountDetails {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    acceptedTerms: boolean
}

interface StepAccountDetailsProps {
    data: AccountDetails
    onChange: (data: AccountDetails) => void
    /** Retour à l'étape précédente du formulaire — au sein de la même page. */
    onBack?: () => void
    /**
     * Retour vers une AUTRE route. Rendu en lien plutôt qu'en navigation
     * programmée : rien n'est modifié au clic, et un lien se précharge,
     * s'ouvre dans un onglet et se copie. StepShell accepte déjà l'un ou
     * l'autre.
     */
    backHref?: string
    onContinue: () => void
    /** true pour un compte créé via lien d'invitation — l'email est déjà connu (celui de l'invitation), pas modifiable */
    emailReadOnly?: boolean
}

export default function StepAccountDetails({
    data,
    onChange,
    onBack,
    backHref,
    onContinue,
    emailReadOnly = false,
}: StepAccountDetailsProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    function update<K extends keyof AccountDetails>(key: K, value: AccountDetails[K]) {
        onChange({ ...data, [key]: value })
    }

    const passwordsMatch = data.confirmPassword.length === 0 || data.password === data.confirmPassword
    const canContinue =
        data.firstName.trim() !== "" &&
        data.lastName.trim() !== "" &&
        (data.email.trim() !== "" || data.phone.trim() !== "") &&
        isPasswordValid(data.password) &&
        data.password === data.confirmPassword &&
        data.acceptedTerms

    return (
        <StepShell
            title="Créer votre compte"
            subtitle="Tous les champs sont requis — courriel ou numéro de téléphone, un seul suffit."
            footer={{
                backLabel: "Retour",
                onBack,
                backHref,
                continueLabel: "Créer mon compte",
                onContinue,
                continueDisabled: !canContinue,
            }}
        >
            <div className={styles.grid}>
                <Input
                    id="firstName"
                    name="firstName"
                    label="Prénom"
                    placeholder="Ex: Jean"
                    value={data.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    autoComplete="given-name"
                    required
                />
                <Input
                    id="lastName"
                    name="lastName"
                    label="Nom"
                    placeholder="Ex: Tremblay"
                    value={data.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    autoComplete="family-name"
                    required
                />
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Adresse courriel"
                    placeholder="nom@exemple.com"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    autoComplete="email"
                    disabled={emailReadOnly}
                />
                <PhoneInput
                    id="phone"
                    name="phone"
                    label="Numéro de téléphone"
                    value={data.phone}
                    onChange={(value) => update("phone", value)}
                />
            </div>

            <div className={styles.passwordGrid}>
                <div className={styles.passwordFields}>
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        label="Mot de passe"
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => update("password", e.target.value)}
                        autoComplete="new-password"
                        required
                        rightElement={
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        }
                    />
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        label="Confirmer le mot de passe"
                        placeholder="••••••••"
                        value={data.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        autoComplete="new-password"
                        required
                        rightElement={
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={
                                    showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                                }
                            >
                                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                            </button>
                        }
                    />
                    {!passwordsMatch && <p className={styles.mismatch}>Les mots de passe ne correspondent pas.</p>}
                </div>

                <PasswordRules password={data.password} />
            </div>

            <Checkbox
                id="acceptedTerms"
                name="acceptedTerms"
                checked={data.acceptedTerms}
                onChange={(e) => update("acceptedTerms", e.target.checked)}
                label={
                    <>
                        J'accepte la collecte de mes données personnelles conformément à la{" "}
                        <a href="/confidentialite" target="_blank" rel="noopener noreferrer">
                            politique de confidentialité
                        </a>{" "}
                        et j'accepte les{" "}
                        <a href="/conditions-utilisation" target="_blank" rel="noopener noreferrer">
                            conditions d'utilisation
                        </a>{" "}
                        de Compétences 360.
                    </>
                }
            />
        </StepShell>
    )
}