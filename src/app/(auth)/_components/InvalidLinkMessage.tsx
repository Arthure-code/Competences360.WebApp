import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLinkSlash } from "@fortawesome/free-solid-svg-icons"
import styles from "./InvalidLinkMessage.module.css"

interface InvalidLinkMessageProps {
    title: string
    message: string
    actionHref: string
    actionLabel: string
}

/**
 * Partagé entre réinitialisation de mot de passe et vérification de
 * courriel — un lien à jeton (token) expiré ou déjà utilisé mérite un
 * message précis, pas un 404 générique : l'utilisateur vient de cliquer un
 * lien légitime qu'il avait reçu, ce n'est pas une page qui n'existe pas.
 */
export default function InvalidLinkMessage({ title, message, actionHref, actionLabel }: InvalidLinkMessageProps) {
    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faLinkSlash} className={styles.icon} aria-hidden="true" />
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.message}>{message}</p>
            <Link href={actionHref} className={styles.action}>
                {actionLabel}
            </Link>
        </div>
    )
}
