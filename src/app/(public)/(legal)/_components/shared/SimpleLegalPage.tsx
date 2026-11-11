import Link from "next/link"
import { faChevronRight, faArrowLeft, faArrowUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./SimpleLegalPage.module.css"

export interface SimpleLegalSection {
    title: string
    content: React.ReactNode
    /** true = ne pas afficher le <h2> automatique (ex: le titre est déjà dans la carte, comme KeyValueCard) */
    hideTitle?: boolean
}

interface SimpleLegalPageProps {
    pageTitle: string
    orgLine: string
    lastUpdated: string
    intro?: React.ReactNode
    sections: SimpleLegalSection[]
}

export default function SimpleLegalPage({
    pageTitle,
    orgLine,
    lastUpdated,
    intro,
    sections,
}: SimpleLegalPageProps) {
    return (
        <div className={styles.page}>
            
            <article className={styles.article}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{pageTitle}</h1>
                    <p className={styles.orgLine}>{orgLine}</p>
                    <p className={styles.lastUpdated}>Dernière mise à jour : {lastUpdated}</p>
                </header>

                <hr className={styles.divider} />

                {intro && <div className={styles.intro}>{intro}</div>}

                {sections.map((section) => (
                    <section key={section.title} className={styles.section}>
                        {!section.hideTitle && <h2 className={styles.sectionTitle}>{section.title}</h2>}
                        <div className={styles.sectionContent}>{section.content}</div>
                    </section>
                ))}

                <div className={styles.footerNav}>
                    <Link href="/" className={styles.footerLink}>
                        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                        Retour à l'accueil
                    </Link>
                    <a href="#top" className={styles.footerLink}>
                        <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" />
                        Haut de page
                    </a>
                </div>
            </article>
        </div>
    )
}
