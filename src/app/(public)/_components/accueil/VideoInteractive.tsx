import styles from "./VideoInteractive.module.css"

const STEPS = [
    "Vous vivez la situation.",
    "Vous prenez la décision.",
    "Vous comprenez la leçon."
]

export default function VideoInteractive() {
    return (
        <section className={styles.section}>
            <div className={styles.mediaPlaceholder} />

            <div className={styles.content}>
                <h2 className={styles.heading}>
                    L'apprentissage qui <span className={styles.underline}>s'adapte</span> à
                    vos choix
                </h2>
                <p className={styles.description}>
                    Nos vidéos interactives vous placent dans des situations réelles du
                    monde du travail : vous décidez, la vidéo suit.
                </p>
                <ul className={styles.list}>
                    {STEPS.map((step) => (
                        <li key={step} className={styles.listItem}>
                            <span className={styles.arrow}>→</span>
                            {step}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
