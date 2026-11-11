import Link from "next/link"
import styles from "./MiniFooter.module.css"

const LINKS = [
    { label: "Conditions d'utilisation", href: "/conditions-d-utilisation" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: "Centre d'aide", href: "/support" },
    { label: "Accessibilité", href: "/accessibilite" },
]

interface MiniFooterProps {
    /** "vertical" (défaut) : empilé, centré — pages publiques. "horizontal" : sur une ligne — espaces apprenant/formateur/etc. */
    variant?: "vertical" | "horizontal"
}

export default function MiniFooter({ variant = "vertical" }: MiniFooterProps) {
    const year = new Date().getFullYear()

    return (
        <footer className={`${styles.footer} ${variant === "horizontal" ? styles.horizontal : ""}`}>
            <ul className={styles.links}>
                {LINKS.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className={styles.link}>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className={styles.meta}>
                <p className={styles.copyright}>
                    © {year} Compétences 360. Tous droits réservés.
                </p>
                <p className={styles.credit}>
                    Propulsé par{" "}
                    <a href="https://lagriffedalpha.com" target="_blank" rel="noopener noreferrer">
                        La Griffe d'Alpha
                    </a>
                </p>
            </div>
        </footer>
    )
}