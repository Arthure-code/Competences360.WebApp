import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faListCheck, faPen, faChartLine } from "@fortawesome/free-solid-svg-icons"
import styles from "./HowItWorks.module.css"

const STEPS = [
    {
        icon: faListCheck,
        title: "1. Choisir un module",
        description:
            "Parcourez notre catalogue et sélectionnez le sujet qui vous intéresse parmi nos catégories."
    },
    {
        icon: faPen,
        title: "2. Compléter les exercices",
        description:
            "Apprenez par la pratique avec des exercices interactifs adaptés à votre niveau."
    },
    {
        icon: faChartLine,
        title: "3. Suivre sa progression",
        description:
            "Visualisez vos succès en temps réel et obtenez des badges pour vos accomplissements."
    }
]

export default function HowItWorks() {
    return (
        <section className={styles.section}>
            <h2 className={styles.heading}>
                Comment ça <span className={styles.underline}>fonctionne</span> ?
            </h2>

            <div className={styles.grid}>
                {STEPS.map((step) => (
                    <div key={step.title} className={styles.step}>
                        <span className={styles.iconWrap}>
                            <FontAwesomeIcon icon={step.icon} className={styles.icon} />
                        </span>
                        <h3 className={styles.stepTitle}>{step.title}</h3>
                        <p className={styles.stepDescription}>{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
