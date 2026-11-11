"use client"

import { Suspense, useCallback, useState, type SyntheticEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import LogoPrimary from "@/components/ui/LogoPrimary"
import Input from "@/components/ui/Input"
import EmailOrPhoneInput from "@/components/ui/EmailOrPhoneInput"
import Checkbox from "@/components/ui/Checkbox"
import Button from "@/components/ui/Button"
import SocialAuthButton from "@/app/(auth)/_components/SocialAuthButton"
import VerrouillageNotice from "@/app/(auth)/_components/VerrouillageNotice"
import MiniFooter from "@/components/layout/MiniFooter"
import Notice from "@/components/shared/Notice"
import { login } from "@/lib/auth"
import { allerVersMonEspace } from "@/_mocks/session.actions"
import styles from "./page.module.css"

function FormulaireConnexion() {
    const searchParams = useSearchParams()
    const [identifiant, setIdentifiant] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [finVerrouillage, setFinVerrouillage] = useState<string | null>(null)
    const terminerVerrouillage = useCallback(() => setFinVerrouillage(null), [])

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = new FormData(event.currentTarget)
        const password = String(form.get("password") ?? "")
        const remember = form.get("remember") !== null

        setSubmitting(true)
        setError(null)

        // identifiant vient de l'état contrôlé (EmailOrPhoneInput), pas du
        // FormData — il formate/détecte en direct, contrairement aux autres
        // champs ici. login() accepte déjà un userName générique (voir
        // lib/auth.ts), peu importe que ce soit un courriel ou un numéro.
        const result = await login(identifiant, password, remember)

        if (!result.success) {
            setFinVerrouillage(result.lockoutEnd ?? null)
            setError(result.lockoutEnd ? null : result.error ?? "Connexion impossible.")
            setSubmitting(false)
            return
        }

        // La navigation est faite par le SERVEUR, dans l'action : c'est la
        // seule façon dont Next invalide le cache du routeur en même temps
        // qu'il redirige. `router.push` partait sinon sur la version
        // « déconnectée » de la cible, et le `refresh()` qui le suivait
        // annulait sa propre navigation (requête RSC en ERR_ABORTED) : on
        // restait sur /connexion, bouton figé, sans erreur nulle part.
        //
        // `?apres=` ramène là où la personne allait avant qu'on lui demande de
        // s'identifier — la confirmation d'une invitation, par exemple. Sa
        // validité est vérifiée côté serveur, pas ici.
        await allerVersMonEspace(searchParams.get("apres"))
    }

    return (
        <div className={styles.page}>
            <div className={styles.imagePanel} />

            <div className={styles.formPanel}>
                <div className={styles.formWrapper}>
                    <LogoPrimary />

                    <div className={styles.heading}>
                        <h1 className={styles.title}>Ravi de vous revoir !</h1>
                        <p className={styles.subtitle}>
                            Accédez à votre espace pour reprendre là où vous vous êtes arrêté.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <SocialAuthButton label="Continuer avec Google" />

                        <div className={styles.divider}>
                            <span className={styles.dividerLine} />
                            <span className={styles.dividerLabel}>OU</span>
                            <span className={styles.dividerLine} />
                        </div>

                        <form className={styles.form} method="post" onSubmit={handleSubmit}>
                            <EmailOrPhoneInput
                                id="identifiant"
                                name="identifiant"
                                label="Courriel ou numéro de téléphone"
                                value={identifiant}
                                onChange={setIdentifiant}
                                required
                            />

                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                label="Mot de passe"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                labelAction={
                                    <Link href="/mot-de-passe-oublie" className={styles.forgotLink}>
                                        Mot de passe oublié?
                                    </Link>
                                }
                                rightElement={
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={
                                            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                                        }
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                }
                            />

                            <Checkbox id="remember" name="remember" label="Se souvenir de moi" defaultChecked />

                            {finVerrouillage && (
                                <VerrouillageNotice finVerrouillage={finVerrouillage} onFin={terminerVerrouillage} />
                            )}

                            {error && (
                                <Notice
                                    notice={{
                                        variant: "error",
                                        icon: "faTriangleExclamation",
                                        title: "Connexion impossible",
                                        message: error,
                                    }}
                                    size="sm"
                                />
                            )}

                            <Button
                                label={isSubmitting ? "Connexion..." : "Se connecter →"}
                                variant="secondary"
                                size="lg"
                                fullWidth
                                type="submit"
                                disabled={isSubmitting || finVerrouillage !== null}
                            />
                        </form>

                        <p className={styles.signupLine}>
                            Pas encore de compte ?{" "}
                            <Link href="/inscription" className={styles.signupLink}>
                                S'inscrire
                            </Link>
                        </p>
                    </div>
                </div>

                <MiniFooter />
            </div>
        </div>
    )
}

/**
 * `useSearchParams()` — lu ici pour `?apres=` — force le rendu côté client et
 * exige une frontière Suspense : sans elle, Next refuse de pré-rendre la page.
 *
 * Le défaut existait déjà, mais restait invisible : tant que la moindre
 * lecture de la mise en page partait en `no-store`, tout l'arbre était
 * dynamique et Next n'essayait jamais le pré-rendu. Rendre la configuration
 * cacheable a rendu cette page pré-rendable — et a révélé l'oubli. Le build
 * de production échouait alors, sans que rien ne l'annonce auparavant.
 */
export default function Connexion() {
    return (
        <Suspense>
            <FormulaireConnexion />
        </Suspense>
    )
}