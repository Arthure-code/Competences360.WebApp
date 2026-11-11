"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { loginAdmin } from "@/_mocksAdmin/adminAuth.actions"
import { routes } from "@/constants/routes"
import styles from "./AdminLoginForm.module.css"


export default function AdminLoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)
        const result = await loginAdmin(email, password)
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
                <h1 className={styles.title}>ADMINISTRATION</h1>

                <label className={styles.field}>
                    <span className={styles.label}>Courriel</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        autoComplete="username"
                        required
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        autoComplete="current-password"
                        required
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
                    {isSubmitting ? "Connexion..." : "Se connecter"}
                </button>
            </form>
        </div>
    )
}