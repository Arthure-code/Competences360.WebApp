import { faUniversalAccess, faHeart, faChartLine, faShieldHalved } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./ValuesGrid.module.css"

const VALUES = [
    {
        icon: faUniversalAccess,
        title: "Accessibilité",
        description:
            "Chaque fonctionnalité est pensée pour les personnes peu à l'aise avec le numérique. Pas d'exception.",
    },
    {
        icon: faHeart,
        title: "Bienveillance",
        description:
            "Nous croyons que l'erreur fait partie de l'apprentissage. La plateforme encourage sans jamais juger.",
    },
    {
        icon: faChartLine,
        title: "Progression",
        description:
            "Chaque exercice complété est un pas de plus. Nous célébrons chaque avancée, grande ou petite.",
    },
    {
        icon: faShieldHalved,
        title: "Confiance",
        description:
            "Vos données restent au Canada et ne sont jamais revendues. Votre vie privée est une priorité.",
    },
]

export default function ValuesGrid() {
    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <p className={styles.kicker}>Nos valeurs</p>

                <ul className={styles.grid}>
                    {VALUES.map((value) => (
                        <li key={value.title} className={styles.card}>
                            <FontAwesomeIcon
                                icon={value.icon}
                                className={styles.icon}
                                aria-hidden="true"
                            />
                            <h3 className={styles.cardTitle}>{value.title}</h3>
                            <p className={styles.cardDescription}>{value.description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
