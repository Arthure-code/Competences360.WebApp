import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUserGraduate, faChalkboardUser, faBuilding } from "@fortawesome/free-solid-svg-icons"
import styles from "./AudienceSection.module.css"

const AUDIENCES = [
    {
        icon: faUserGraduate,
        title: "Employés",
        description: "Lisez mieux, calculez plus vite, communiquez avec confiance, à votre rythme, sans pression."
    },
    {
        icon: faChalkboardUser,
        title: "Formateurs",
        description: "Assignez des parcours, suivez la progression de chacun et exportez les résultats en un clic."
    },
    {
        icon: faBuilding,
        title: "Organisations",
        description: "Offrez à vos employés une formation moderne et accessible, sans organiser de journées en salle."
    }
]

export default function AudienceSection() {
    return (
        <section className={styles.section}>
            <h2 className={styles.heading}>
                À qui <span className={styles.underline}>s'adresse</span> la
                plateforme ?
            </h2>

            <div className={styles.grid}>
                {AUDIENCES.map((audience) => (
                    <div key={audience.title} className={styles.item}>
                        <span className={styles.iconWrap}>
                            <FontAwesomeIcon icon={audience.icon} className={styles.icon} />
                        </span>
                        <h3 className={styles.itemTitle}>{audience.title}</h3>
                        <p className={styles.itemDescription}>{audience.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
