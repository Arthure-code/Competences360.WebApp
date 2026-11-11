import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowUpRightFromSquare, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import styles from "./PrivacyCard.module.css"

interface PrivacyLink {
    id: string
    label: string
    href: string
    external: boolean
}

/** Commun à tous les rôles. */
const PRIVACY_LINKS: PrivacyLink[] = [
    { id: "privacy-policy", label: "Politique de confidentialité", href: "/confidentialite", external: true },
    { id: "terms", label: "Conditions d'utilisation", href: "/conditions-d-utilisation", external: true },
    { id: "consent", label: "Gérer mon consentement", href: "/parametres/consentement", external: false },
]

export default function PrivacyCard() {
    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader title="Confidentialité et données" subtitle="Contrôlez vos données personnelles." />

            <div className={styles.list}>
                {PRIVACY_LINKS.map((link) => (
                    <a
                        key={link.id}
                        href={link.href}
                        className={styles.item}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                    >
                        <span>{link.label}</span>
                        <FontAwesomeIcon
                            icon={link.external ? faArrowUpRightFromSquare : faChevronRight}
                            className={styles.icon}
                            aria-hidden="true"
                        />
                    </a>
                ))}
            </div>
        </Card>
    )
}