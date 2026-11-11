"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { faKey } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { changeAdminPassword } from "@/_mocksAdmin/adminAuth.actions"
import { routes } from "@/constants/routes"
import styles from "./PremiereConnexionForm.module.css"

interface PremiereConnexionFormProps {
    adminName: string
}


export default function PremiereConnexionForm({ adminName }: PremiereConnexionFormProps) {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Les deux mots de passe ne correspondent pas.")
            return
        }

        setIsSubmitting(true)
        const result = await changeAdminPassword(password)
        setIsSubmitting(false)

        if (!result.success) {
            setError(result.error ?? "Une erreur est survenue.")
            return
        }

        router.push(routes.admin.home)
    }

    return (
        <div className={styles.page}>
            <form className={styles.card} onSubmit={handleSubmit}>
                <h1 className={styles.title}>PREMIÈRE CONNEXION</h1>
                <p className={styles.subtitle}>
                    Bienvenue {adminName} ! <br />
                    Choisissez un nouveau mot de passe avant de continuer. C'est la seule 
                    étape nécessaire pour accéder à la zone admin.
                </p>

                <label className={styles.field}>
                    <span className={styles.label}>Nouveau mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        autoComplete="new-password"
                        required
                        minLength={4}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Confirmer le mot de passe</span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                        autoComplete="new-password"
                        required
                        minLength={4}
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                    {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
                </button>
            </form>
        </div>
    )
}