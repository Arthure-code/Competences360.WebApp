import Link from "next/link"
import styles from "./ContactCta.module.css"
import Button from "@/components/ui/Button"

export default function ContactCta() {
    return (
        <section className={styles.cta}>

            <h2 className={styles.title}>Vous ne trouvez pas l'information recherchée ?</h2>
            <p className={styles.subtitle}>
                Notre équipe vous répondra dans les plus brefs délais.
            </p>
            <Link href="/contact" className={styles.ctaButton}>
                <Button label="Nous contacter" variant="secondary" />
            </Link>

        </section>
    )
}
