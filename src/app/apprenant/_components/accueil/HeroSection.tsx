import Card from "@/components/ui/Card"
import styles from "./HeroSection.module.css"

interface HeroSectionProps {
    firstName: string
}

/** Bloc d'accueil — message de bienvenue + illustration. */
export default function HeroSection({ firstName }: HeroSectionProps) {
    return (
        <section className={styles.heroRow}>
            <Card className={styles.welcomeCard}>
                <h1 className={styles.welcomeTitle}>Bonjour, {firstName} !</h1>
                <p className={styles.welcomeSubtitle}>
                    Content de vous revoir. Votre prochain exercice vous attend. La réussite est à portée de main !
                </p>
            </Card>

            <div className={styles.heroImageContainer}>
                <img
                    src="/img/bee-cartoon-illustration-test.png"
                    alt="Illustration de l'apprenant en train d'apprendre"
                />
            </div>
        </section>
    )
}
