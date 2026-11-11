"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { faBell, faCircleQuestion } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import SearchInput from "@/components/ui/SearchInput"
import Avatar from "@/components/ui/Avatar"
import styles from "./Topbar.module.css"

interface TopbarUser {
    firstName: string
    lastName: string
    /** Nom complet déjà formaté (ex. via getFullName) — affiché tel quel, évite de dupliquer ce calcul ici */
    name: string
    /** Libellé du rôle affiché sous le nom, ex. "Apprenante", "Formateur" */
    role: string
    avatarUrl?: string
}

interface TopbarProps {
    user: TopbarUser
    /** Route "Mon compte" du rôle courant — cliquer la photo/le nom y mène */
    accountHref: string
    notificationCount?: number
    searchPlaceholder?: string
    onSearch?: (query: string) => void
    onHelpClick?: () => void
    onNotificationsClick?: () => void
    /** Rendu juste sous le champ de recherche (voir GlobalSearchResults.tsx), Topbar ne connaît rien du contenu, juste l'emplacement positionné */
    searchResults?: ReactNode
    /** Rendu entre les icônes et l'avatar — ex. <SpaceSwitcher> pour un compte formateur+gestionnaire. Topbar ne connaît rien de Role/multi-espace, juste un emplacement. */
    spaceSwitcher?: ReactNode
    /**
     * Rendu dans le groupe d'icônes, avant Aide/Notifications — optionnel,
     * aucun effet sur les 3 espaces normaux qui ne le passent pas. Sert
     * l'espace Admin (bouton "Signaler un problème"), générique pour
     * toute future icône d'action similaire sans devoir réouvrir ce
     * composant à chaque fois.
     */
    extraActions?: ReactNode
    className?: string
}

/**
 * Barre supérieure générique — aucun contenu spécifique au rôle.
 * Gère son propre état de recherche (SearchInput est un composant contrôlé).
 */
export default function Topbar({
    user,
    accountHref,
    notificationCount = 0,
    searchPlaceholder = "Rechercher...",
    onSearch,
    onHelpClick,
    onNotificationsClick,
    searchResults,
    spaceSwitcher,
    extraActions,
    className = "",
}: TopbarProps) {
    const [query, setQuery] = useState("")

    function handleChange(value: string) {
        setQuery(value)
        onSearch?.(value)
    }

    return (
        <header className={`${styles.topbar} ${className}`}>
            <div className={styles.searchArea}>
                <SearchInput
                    value={query}
                    onChange={handleChange}
                    placeholder={searchPlaceholder}
                    className={styles.search}
                />
                {searchResults}
            </div>

            <div className={styles.actions}>
                <div className={styles.iconButtons}>
                    {extraActions}

                    <button type="button" className={styles.iconButton} onClick={onHelpClick} aria-label="Aide">
                        <FontAwesomeIcon icon={faCircleQuestion} />
                    </button>

                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={onNotificationsClick}
                        aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} non lues)` : ""}`}
                    >
                        <FontAwesomeIcon icon={faBell} />
                        {notificationCount > 0 && <span className={styles.badge}>{notificationCount}</span>}
                    </button>
                </div>

                {spaceSwitcher}

                <Link href={accountHref} className={styles.userLink}>
                    <Avatar
                        firstName={user.firstName}
                        lastName={user.lastName}
                        avatarUrl={user.avatarUrl}
                        size={40}
                    />
                    <div className={styles.user}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userRole}>{user.role}</span>
                    </div>
                </Link>
            </div>
        </header>
    )
}