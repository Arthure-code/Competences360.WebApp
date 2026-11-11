import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLock } from "@fortawesome/free-solid-svg-icons"
import styles from "@/app/not-found.module.css"

/**
 * 403 — prête, mais : rien ne la déclenche
 * encore, faute de vrai contrôle d'accès par rôle (middleware.ts ou
 * vérification dans chaque layout de rôle, à construire une fois la vraie
 * authentification branchée). Réutilise le CSS de not-found.tsx — même
 * famille de page ("vous ne pouvez pas être ici"), pas besoin d'un
 * deuxième fichier de styles identique.
 */
export default function AccessDeniedPage() {
    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faLock} className={styles.icon} aria-hidden="true" />
            <h1 className={styles.title}>Accès refusé</h1>
            <p className={styles.message}>Vous n'avez pas la permission de voir cette page.</p>
            <Link href="/" className={styles.action}>
                Retour à l'accueil
            </Link>
        </div>
    )
}