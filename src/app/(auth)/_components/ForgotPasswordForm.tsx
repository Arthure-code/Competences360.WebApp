"use client"

import { useState } from "react"
import Link from "next/link"
import Button from "@/components/ui/Button"
import { requestPasswordReset } from "@/_mocks/passwordReset.actions"
import { routes } from "@/constants/routes"
import styles from "./ForgotPasswordForm.module.css"

/**
 * Retourne toujours le même message de succès, peu importe si le courriel
 * existe réellement dans le système — pratique standard de sécurité (voir
 * requestPasswordReset). Ne jamais dire "ce courriel n'existe pas".
 */
export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return
        setIsSubmitting(true)
        await requestPasswordReset(email.trim())
        setIsSubmitting(false)
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <div className={styles.wrapper}>
                <h1 className={styles.title}>Vérifiez vos courriels</h1>
                <p className={styles.subtitle}>
                    Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être
                    envoyé.
                </p>
                <Link href={routes.auth.login} className={styles.backLink}>
                    Retour à la connexion
                </Link>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Mot de passe oublié</h1>
            <p className={styles.subtitle}>Entrez votre courriel — on vous enverra un lien pour le réinitialiser.</p>

            <form method="post" onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.field}>
                    <span className={styles.label}>Courriel</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="vous@exemple.com"
                        autoFocus
                        required
                    />
                </label>

                <Button label={isSubmitting ? "Envoi..." : "Envoyer le lien"} type="submit" disabled={isSubmitting} />
            </form>

            <Link href={routes.auth.login} className={styles.backLink}>
                Retour à la connexion
            </Link>
        </div>
    )
}