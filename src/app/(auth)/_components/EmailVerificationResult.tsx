"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleCheck, faCircleXmark, faSpinner } from "@fortawesome/free-solid-svg-icons"
import { confirmEmailVerification } from "@/_mocks/emailVerification.actions"
import { routes } from "@/constants/routes"
import styles from "./EmailVerificationResult.module.css"

interface EmailVerificationResultProps {
    token: string
}

type Status = "verifying" | "success" | "error"

/** La confirmation elle-même (mutation) se fait ici, côté client, au montage — page.tsx n'a fait que vérifier que le jeton existe encore avant de rendre ce composant. */
export default function EmailVerificationResult({ token }: EmailVerificationResultProps) {
    const [status, setStatus] = useState<Status>("verifying")

    useEffect(() => {
        confirmEmailVerification(token).then((success) => setStatus(success ? "success" : "error"))
    }, [token])

    if (status === "verifying") {
        return (
            <div className={styles.wrapper}>
                <FontAwesomeIcon icon={faSpinner} className={styles.iconSpinning} aria-hidden="true" />
                <p className={styles.message}>Confirmation en cours...</p>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className={styles.wrapper}>
                <FontAwesomeIcon icon={faCircleXmark} className={styles.iconError} aria-hidden="true" />
                <h1 className={styles.title}>Échec de la confirmation</h1>
                <p className={styles.message}>Réessayez, ou contactez le soutien si le problème persiste.</p>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faCircleCheck} className={styles.iconSuccess} aria-hidden="true" />
            <h1 className={styles.title}>Courriel confirmé</h1>
            <p className={styles.message}>Votre compte est prêt.</p>
            <Link href={routes.auth.login} className={styles.action}>
                Aller à la connexion
            </Link>
        </div>
    )
}
