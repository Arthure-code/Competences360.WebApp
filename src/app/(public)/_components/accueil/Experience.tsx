import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    faVolumeHigh,
    faTrophy,
    faRotateLeft,
    faBolt,
    faCircleCheck
} from "@fortawesome/free-solid-svg-icons"
import styles from "./Experience.module.css"

const FEATURES = [
    {
        icon: faVolumeHigh,
        title: "Accessibilité vocale",
        description: "Écoutez le contenu à voix haute plutôt que de le lire grâce à la lecture vocale intégrée."
    },
    {
        icon: faTrophy,
        title: "Badges & trophées",
        description: "Suivez votre progression et célébrez vos réussites tout au long de votre parcours."
    },
    {
        icon: faRotateLeft,
        title: "Reprise automatique",
        description: "Reprenez exactement là où vous vous êtes arrêté, sans perdre votre progression."
    },
    {
        icon: faBolt,
        title: "Rétroaction immédiate",
        description: "Sachez immédiatement si vos réponses sont correctes et comprenez vos erreurs."
    }
]

const CHECKLIST = [
    "Exercices interactifs et stimulants",
    "Interface simplifiée et épurée",
    "Suivi de progression visuel et clair"
]

export default function Experience() {
    return (
        <section className={styles.section}>
            <div className={styles.grid}>
                {FEATURES.map((feature) => (
                    <div key={feature.title} className={styles.card}>
                        <p className={styles.cardTitle}>
                            <FontAwesomeIcon icon={feature.icon} className={styles.icon} />
                            {feature.title}
                        </p>
                        <p className={styles.cardDescription}>{feature.description}</p>
                    </div>
                ))}
            </div>

            <div className={styles.content}>
                <h2 className={styles.heading}>Une expérience d'apprentissage enrichie</h2>
                <div className={styles.textContent}>
                    <p className={styles.description}>
                        Notre plateforme a été conçue pour faciliter l'apprentissage.
                        Chaque fonctionnalité vise à offrir une expérience fluide,
                        encourageante et accessible à tous, quel que soit votre niveau de
                        départ.
                    </p>
                    <ul className={styles.checklist}>
                        {CHECKLIST.map((item) => (
                            <li key={item} className={styles.checklistItem}>
                                <FontAwesomeIcon icon={faCircleCheck} className={styles.checkIcon} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
