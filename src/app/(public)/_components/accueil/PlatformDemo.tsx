import styles from "./PlatformDemo.module.css"

export default function PlatformDemo() {
    return (
        <section className={styles.section}>
            <div className={styles.content}>
                <h2 className={styles.heading}>Voyez la plateforme en action</h2>
                <p className={styles.description}>
                    Visionnez la vidéo ci-après pour découvrir rapidement les
                    fonctionnalités de chaque profil.
                </p>
            </div>

            <div className={styles.mediaPlaceholder} />
        </section>
    )
}
