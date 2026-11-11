import Link from "next/link"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./SuccessMessage.module.css"

export default function SuccessMessage() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.iconCircle}>
                <FontAwesomeIcon icon={faCheck} className={styles.icon} aria-hidden="true" />
            </div>
            <h2 className={styles.title}>Message envoyé !</h2>
            <p className={styles.description}>
                Merci de nous avoir contacté. Nous avons bien reçu votre message
                et nous vous répondrons dans les plus brefs délais.
            </p>
            <Link href="/" className={styles.button}>
                Retour à l'accueil
            </Link>
        </div>
    )
}
