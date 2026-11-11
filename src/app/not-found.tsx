import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCompass } from "@fortawesome/free-solid-svg-icons"
import styles from "./not-found.module.css"

/** Convention Next.js — se rend automatiquement pour toute route inexistante, et chaque fois que notFound() est appelé explicitement (ex. version/module introuvable). */
export default function NotFound() {
    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faCompass} className={styles.icon} aria-hidden="true" />
            <h1 className={styles.title}>Page introuvable</h1>
            <p className={styles.message}>Cette page n'existe pas, ou plus.</p>
            <Link href="/" className={styles.action}>
                Retour à l'accueil
            </Link>
        </div>
    )
}