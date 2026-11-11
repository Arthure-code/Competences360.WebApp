"use client"

import type { ElementType, ReactNode } from "react"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useDrawer } from "@/hooks/useDrawer"
import styles from "./Drawer.module.css"

interface DrawerProps {
    /** Contenu affiché dans la zone cliquable (question, titre, label...) */
    trigger: ReactNode
    /** Contenu affiché quand le tiroir est ouvert */
    children: ReactNode
    /** Mode contrôlé : si fourni, le parent gère l'état ouvert/fermé */
    open?: boolean
    /** Mode non-contrôlé : état initial si `open` n'est pas fourni */
    defaultOpen?: boolean
    /** Appelé à chaque tentative de bascule, dans les deux modes */
    onOpenChange?: (open: boolean) => void
    /** Id stable pour lier aria-controls / région (utile en liste, ex. FAQ) */
    id?: string
    /** Élément HTML du conteneur externe (div par défaut) — ex: "li" dans une liste, "section" ailleurs */
    as?: ElementType
    /** Retire bordure/fond/padding par défaut, pour intégrer le mécanisme dans un contexte déjà stylé */
    bare?: boolean
    className?: string
    triggerClassName?: string
    contentClassName?: string
}

export default function Drawer({
    trigger,
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    id,
    as: Wrapper = "div",
    bare = false,
    className = "",
    triggerClassName = "",
    contentClassName = "",
}: DrawerProps) {
    const { isOpen, toggle, contentId } = useDrawer({ open, defaultOpen, onOpenChange, id })

    return (
        <Wrapper
            className={`${bare ? styles.bareDrawer : styles.drawer} ${
                isOpen ? styles.open : styles.closed
            } ${className}`}
        >
            <button
                type="button"
                className={`${bare ? styles.bareTrigger : styles.trigger} ${triggerClassName}`}
                onClick={toggle}
                aria-expanded={isOpen}
                aria-controls={contentId}
            >
                <span className={styles.triggerContent}>{trigger}</span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                    aria-hidden="true"
                />
            </button>
            {isOpen && (
                <div
                    id={contentId}
                    className={`${styles.content} ${contentClassName}`}
                    role="region"
                >
                    {children}
                </div>
            )}
        </Wrapper>
    )
}