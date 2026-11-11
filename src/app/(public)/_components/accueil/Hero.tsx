import styles from "./Hero.module.css"
import Button from "@/components/ui/Button"

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.collage}>
                <div className={[styles.photo, styles.photoTall, styles.containerCreux].join(" ")} />
                <div className={styles.photo} />
                <div className={styles.photo} />
                {/* <div className={[styles.photo, styles.photoWide].join(" ")} /> */}
            </div>

            <div className={styles.content}>
                <h1 className={styles.title}>
                    Apprenez à votre rythme, sans vous sentir perdu
                </h1>
                <p className={styles.subtitle}>
                    Des situations réelles tirées du milieu de travail. Un suivi qui
                    montre vos progrès jour après jour. Parce qu'apprendre ne
                    devrait jamais être compliqué.
                </p>
                <div className={styles.actions}>
                    <Button label="S'inscrire gratuitement" variant="primary" />
                    <Button label="Se connecter" variant="outline" />
                </div>
            </div>

            <div className={styles.collage}>
                <div className={[styles.photo, styles.photoTall].join(" ")} />
                <div className={styles.photo} />
                <div className={styles.photo} />
                {/* <div className={[styles.photo, styles.photoWide].join(" ")} /> */}
            </div>
        </section>
    )
}
