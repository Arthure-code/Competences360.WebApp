"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/Button"
import PasswordRules, { isPasswordValid } from "./PasswordRules"
import { resetPassword } from "@/_mocks/passwordReset.actions"
import { routes } from "@/constants/routes"
import styles from "./ResetPasswordForm.module.css"

interface ResetPasswordFormProps {
    token: string
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword
    const canSubmit = isPasswordValid(password) && password === confirmPassword

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!canSubmit) return
        setIsSubmitting(true)
        setError(null)

        const success = await resetPassword(token, password)
        if (!success) {
            setError("Ce lien n'est plus valide. Demandez-en un nouveau.")
            setIsSubmitting(false)
            return
        }

        router.push(routes.auth.login)
    }

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Nouveau mot de passe</h1>
            <p className={styles.subtitle}>Choisissez un nouveau mot de passe pour votre compte.</p>

            <form method="post" onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.field}>
                    <span className={styles.label}>Nouveau mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        autoComplete="new-password"
                        autoFocus
                        required
                    />
                </label>

                <PasswordRules password={password} />

                <label className={styles.field}>
                    <span className={styles.label}>Confirmer le mot de passe</span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                        autoComplete="new-password"
                        required
                    />
                    {!passwordsMatch && <span className={styles.label}>Les mots de passe ne correspondent pas.</span>}
                </label>

                {error && <p className={styles.subtitle}>{error}</p>}

                <Button
                    label={isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                />
            </form>

            <Link href={routes.auth.login} className={styles.backLink}>
                Retour à la connexion
            </Link>
        </div>
    )
}
