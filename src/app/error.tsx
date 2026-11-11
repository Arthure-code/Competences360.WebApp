"use client"

import { useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import styles from "./not-found.module.css"

interface ErrorPageProps {
    error: Error & { digest?: string }
    unstable_retry: () => void
}

/**
 * Convention Next.js — attrape toute erreur non gérée dans une route
 * imbriquée (le layout racine, lui, reste debout et continue de
 * fonctionner). DOIT être "use client" (contrainte Next.js). `unstable_retry()`
 * recharge les données de la page puis la réaffiche, sans recharger tout le site.
 */
export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
    useEffect(() => {
        // TODO (backend/monitoring) : envoyer à un vrai service de suivi d'erreurs (Sentry, etc.)
        console.error(error)
    }, [error])

    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faTriangleExclamation} className={styles.icon} aria-hidden="true" />
            <h1 className={styles.title}>Une erreur est survenue</h1>
            <p className={styles.message}>Réessayez — si ça persiste, contactez le soutien.</p>
            <Button label="Réessayer" onClick={() => unstable_retry()} />
        </div>
    )
}