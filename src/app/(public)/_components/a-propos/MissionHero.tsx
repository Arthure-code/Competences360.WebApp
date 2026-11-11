import styles from "./MissionHero.module.css"

export default function MissionHero() {
    return (
        <section className={styles.hero}>
            <p className={styles.kicker}>Notre mission</p>
            <h1 className={styles.title}>Apprendre ne devrait jamais être compliqué.</h1>
            <p className={styles.description}>
                La Griffe d'Alpha accompagne les organisations québécoises depuis 25 ans à
                renforcer les compétences fondamentales de leurs équipes — littératie, numératie,
                savoir-être — avec une approche centrée sur l'humain. Compétences 360 est
                l'aboutissement de cette expertise : une plateforme qui respecte le rythme et
                la réalité de chaque travailleur, en formation comme au travail, peu importe son
                niveau de départ.
            </p>
        </section>
    )
}
