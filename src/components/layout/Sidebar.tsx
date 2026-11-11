"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    IconDefinition,
    faRightFromBracket,
    faBars,
    faXmark,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import LogoPrimary from "@/components/ui/LogoPrimary"
import styles from "./Sidebar.module.css"

export interface SidebarItem {
    label: string
    href: string
    icon: IconDefinition
}

interface SidebarProps {
    /** Config des liens — différente par rôle (apprenant/formateur/gestionnaire) */
    items: SidebarItem[]
    /** Accueil de l'espace courant (voir ROLE_HOME_PATH, routes.ts) — le logo y mène, pas à la page d'accueil publique du site */
    homeHref: string
    onLogout: () => void
    className?: string
    hideLogo?: boolean
}

/**
 * Coquille de navigation générique : ne connaît rien du rôle courant.
 * Chaque layout de rôle (apprenant/layout.tsx, formateur/layout.tsx, ...)
 * lui passe sa propre liste d'items.
 *
 * Sous 1024px, la sidebar se comporte comme un panneau qui s'ouvre par-dessus
 * le contenu (même logique que le menu mobile du Navbar), avec un bouton
 * hamburger fixe et un backdrop pour fermer.
 */
export default function Sidebar({ items, homeHref, onLogout, className = "", hideLogo = false }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Ferme le panneau à chaque changement de route (navigation via un lien).
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Verrouille le scroll de la page pendant que le panneau mobile est ouvert.
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    // Ferme le panneau avec la touche Échap.
    useEffect(() => {
        if (!isOpen) return
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setIsOpen(false)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    function handleLogout() {
        setIsOpen(false)
        onLogout()
    }

    return (
        <>
            <button
                type="button"
                className={styles.mobileToggle}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-controls="sidebar-nav"
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
                <FontAwesomeIcon
                    icon={isOpen ? faXmark : faBars}
                    className={styles.toggleIcon}
                    aria-hidden="true"
                />
            </button>

            <div
                className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            <aside
                id="sidebar-nav"
                className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""} ${className}`}
            >
                {!hideLogo && (
                    <div className={styles.brand}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logoMini}>
                                <LogoPrimary size="lg" variant="mini" href={homeHref} />
                            </div>
                            <div className={styles.logoFull}>
                                <LogoPrimary size="lg" variant="full" href={homeHref} />
                            </div>
                        </div>
                    </div>
                )}

                <nav className={styles.nav} aria-label="Navigation principale">
                    {items.map((item) => {
                        const isActive =
                            pathname === item.href || pathname?.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <FontAwesomeIcon icon={item.icon} className={styles.icon} aria-hidden="true" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <button type="button" onClick={handleLogout} className={styles.logout}>
                    <FontAwesomeIcon icon={faRightFromBracket} className={styles.icon} aria-hidden="true" />
                    Se déconnecter
                </button>
            </aside>
        </>
    )
}