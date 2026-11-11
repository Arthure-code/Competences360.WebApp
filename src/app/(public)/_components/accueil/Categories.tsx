import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBook, faCalculator, faUsers } from "@fortawesome/free-solid-svg-icons"
import styles from "./Categories.module.css"

const CATEGORIES = [
    {
        icon: faBook,
        title: "Littératie",
        description:
            "Lire un courriel, rédiger un message, comprendre un document. Des compétences essentielles au travail.",
        modules: "12 modules disponibles"
    },
    {
        icon: faCalculator,
        title: "Numératie",
        description:
            "Calculer, interpréter des chiffres, gérer des quantités. Des exercices ancrés dans des situations que vous vivez vraiment.",
        modules: "10 modules disponibles"
    },
    {
        icon: faUsers,
        title: "Savoir-être",
        description:
            "Communiquer, collaborer, gérer des situations difficiles. Des compétences humaines qui font la différence chaque jour.",
        modules: "15 modules disponibles"
    }
]

export default function Categories() {
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.heading}>Nos catégories d'apprentissage</h2>
                <p className={styles.subheading}>
                    Des parcours ciblés pour répondre aux besoins du marché du travail.
                </p>
            </div>

            <div className={styles.grid}>
                {CATEGORIES.map((category) => (
                    <div key={category.title} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{category.title}</h3>
                            <span className={styles.iconWrap}>
                                <FontAwesomeIcon icon={category.icon} className={styles.icon} />
                            </span>
                        </div>
                        <p className={styles.cardDescription}>{category.description}</p>
                        <p className={styles.cardModules}>{category.modules}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
