"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faLinkedinIn } from '@fortawesome/free-brands-svg-icons'
import styles from '@/components/layout/Footer.module.css';
import LogoPrimary from '@/components/ui/LogoPrimary';
import { useCookieConsent } from '@/components/shared/CookieConsentProvider';

const USEFUL_LINKS = [
    { label: 'À propos', href: '/a-propos' },
    { label: "Centre d'aide", href: '/support' },
    { label: 'Contact', href: '/contact' },
    { label: 'Cookies', href: null }
]

const LEGAL_LINKS = [
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: "Conditions d'utilisation", href: '/conditions-d-utilisation' },
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Accessibilité', href: '/accessibilite' },
    { label: 'Politique de cookies', href: '/politique-de-cookies' }
]

export default function Footer() {
    const year = new Date().getFullYear()
    const { openModal } = useCookieConsent()

    return (
        <footer className={styles.footer}>
            <div className={styles.top}>
                <div className={styles.brand}>
                    <LogoPrimary size="lg" />
                    <p className={styles.tagline}>
                        La plateforme de référence pour le développement de compétences essentielles au Québec.
                    </p>
                </div>

                <div>
                    <h3 className={styles.heading}>Liens utiles</h3>
                    <ul className={styles.list}>
                        {USEFUL_LINKS.map((link) =>
                            link.href ? (
                                <li key={link.href}>
                                    <a href={link.href} className={styles.link}>
                                        {link.label}
                                    </a>
                                </li>
                            ) : (
                                <li key={link.label}>
                                    <button
                                        type="button"
                                        onClick={openModal}
                                        className={styles.link}
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            )
                        )}
                    </ul>
                </div>

                <div>
                    <h3 className={styles.heading}>Légal</h3>
                    <ul className={styles.list}>
                        {LEGAL_LINKS.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} className={styles.link}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className={styles.heading}>Suivez-nous</h3>
                    <div className={styles.socials}>
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcon}
                            aria-label="Facebook"
                        >
                            <FontAwesomeIcon icon={faFacebookF} />
                        </a>
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcon}
                            aria-label="LinkedIn"
                        >
                            <FontAwesomeIcon icon={faLinkedinIn} />
                        </a>
                    </div>
                </div>
            </div>

            <div className={styles.bottom}>
                <p className={styles.copyright}>© {year} Compétences 360. Tous droits réservés.</p>
                <p className={styles.credit}>
                    Propulsé par{' '}
                    <a href="https://lagriffedalpha.square.site/" target="_blank" rel="noopener noreferrer">
                        La Griffe d'Alpha
                    </a>
                </p>
            </div>
        </footer>
    )
}