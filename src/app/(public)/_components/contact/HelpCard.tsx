import Link from "next/link"
import styles from "./HelpCard.module.css"

export default function HelpCard() {
    return (
        <div className={styles.card}>
            <h2 className={styles.title}>Besoin d'aide immédiate ?</h2>
            <p className={styles.description}>
                Si vous avez de la difficulté à naviguer sur la plateforme,
                n'hésitez pas à demander à un collègue ou à consulter notre{" "}
                <Link href="/support" className={styles.link}>
                    centre d'aide <span aria-hidden="true">→</span>
                </Link>
            </p>
        </div>
    )
}
