import styles from "./ContactIntro.module.css"

export default function ContactIntro() {
    return (
        <div className={styles.card}>
            <h1 className={styles.title}>Nous sommes là pour vous aider</h1>
            <p className={styles.description}>
                Vous avez une question sur nos modules ou un problème technique ?
                Remplissez le formulaire ci-dessous et notre équipe vous répondra
                dans les plus brefs délais.
            </p>
        </div>
    )
}
