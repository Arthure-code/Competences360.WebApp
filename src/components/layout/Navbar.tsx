"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "@/components/layout/Navbar.module.css";
import LogoPrimary from "@/components/ui/LogoPrimary";
import Button from "@/components/ui/Button";
import Link from "next/dist/client/link";

const NAV_LINKS = [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '/a-propos' },
    { label: 'Contact', href: '/contact' },
    { label: 'Aide', href: '/support' }
]

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    return (
        <header className={styles.navbar}>
            <div className={styles.bar}>
                <LogoPrimary />

                <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-expanded={isOpen}
                    aria-controls="mobile-menu"
                    aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                    {isOpen ? (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon}>
                            <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.toggleIcon}>
                            <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="4" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>
                    )}
                </button>

                <div className={styles.center}>
                    <ul className={styles.links}>
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href
                            return (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className={[styles.link, isActive ? styles.active : ''].join(' ')}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                <div className={styles.actions}>
                    <Button label="Inscription" variant="outline" href="/inscription" fullWidth />
                    <Button label="Connexion" variant="secondary" href="/connexion" fullWidth />
                </div>
            </div>

            <div id="mobile-menu" className={[styles.mobileMenu, isOpen ? styles.mobileMenuOpen : ''].join(' ')}>
                <ul className={styles.mobileLinks}>
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <a href={link.href} className={styles.link} onClick={() => setIsOpen(false)}>
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className={styles.mobileActions}>
                    <Button label="Inscription" variant="outline" href="/inscription" fullWidth />
                    <Button label="Connexion" variant="secondary" href="/connexion" fullWidth />
                </div>
            </div>
        </header>
    )
}