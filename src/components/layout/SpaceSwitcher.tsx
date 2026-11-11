"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown, faChalkboardUser, faBuilding } from "@fortawesome/free-solid-svg-icons"
import { ROLE_HOME_PATH } from "@/constants/routes"
import { ROLE_LABELS, type Role } from "@/constants/roles"
import styles from "./SpaceSwitcher.module.css"

interface SpaceSwitcherProps {
    /** Espace actuellement affiché — déterminé par la route (le layout.tsx du dossier visité), pas un état client */
    currentRole: Role
    /** Tous les rôles "espace de travail" actifs sur le compte (session.user.roles) — apprenant n'apparaît jamais ici avec un autre rôle */
    availableRoles: Role[]
}

const ROLE_ICON: Partial<Record<Role, typeof faChalkboardUser>> = {
    formateur: faChalkboardUser,
    gestionnaire: faBuilding,
}

/**
 * N'affiche rien pour un compte mono-rôle (le cas normal) — seulement
 * pertinent pour formateur+gestionnaire cumulé. Bascule = un simple lien
 * vers routes.[autreRôle].home, pas un toggle d'état — le rôle "actif"
 * vit déjà dans l'URL/le layout, pas dans ce composant.
 */
export default function SpaceSwitcher({ currentRole, availableRoles }: SpaceSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    if (availableRoles.length <= 1) return null

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                Espace {ROLE_LABELS[currentRole]}
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className={styles.menu} role="menu">
                    {availableRoles.map((role) => {
                        const icon = ROLE_ICON[role]
                        return (
                            <Link
                                key={role}
                                href={ROLE_HOME_PATH[role]}
                                className={`${styles.menuItem} ${role === currentRole ? styles.menuItemActive : ""}`}
                                onClick={() => setIsOpen(false)}
                                role="menuitem"
                            >
                                {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
                                Espace {ROLE_LABELS[role]}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
