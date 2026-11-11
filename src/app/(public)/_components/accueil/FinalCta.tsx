import styles from "./FinalCta.module.css"
import Button from "@/components/ui/Button"

export default function FinalCta() {
    return (
        <section className={styles.section}>
            <h2 className={styles.heading}>Prêt à commencer ?</h2>
            <p className={styles.description}>
                Faites partie des premiers à utiliser Compétences 360, et ce, dès
                aujourd'hui.
            </p>
            <div className={styles.actions}>
                <Button label="Créer mon compte" variant="primary" />
                <Button label="Parler à l'équipe" variant="outline" />
            </div>
        </section>
    )
}
