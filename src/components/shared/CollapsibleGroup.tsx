"use client"

import { useState, type ReactNode } from "react"
import Drawer from "@/components/ui/Drawer"
import styles from "./CollapsibleGroup.module.css"

interface CollapsibleGroupProps {
    label: string
    children: ReactNode
    defaultOpen?: boolean
    className?: string
    /** Classes additionnelles pour le déclencheur — pour adapter l'apparence au contexte (ex. ligne de tableau) sans changer le comportement */
    triggerClassName?: string
    /** Affiche "Afficher plus/moins" à côté du chevron — défaut true. Mettre à false pour un chevron seul, quand le texte est redondant avec le contexte (ex. ligne de groupe dans un tableau). */
    showToggleLabel?: boolean
}

/**
 * Ligne de groupe repliable générique : label à gauche, "Afficher
 * plus/moins" optionnel + chevron à droite (via Drawer), contenu en
 * dessous. Pas spécifique aux modules/catégories — utilisable partout où
 * une liste de lignes doit être groupée sous un label repliable.
 */
export default function CollapsibleGroup({
    label,
    children,
    defaultOpen = true,
    className,
    triggerClassName,
    showToggleLabel = true,
}: CollapsibleGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Drawer
            as="div"
            bare
            open={isOpen}
            onOpenChange={setIsOpen}
            className={className}
            triggerClassName={`${styles.trigger} ${triggerClassName ?? ""}`}
            contentClassName={styles.content}
            trigger={
                <span className={styles.triggerRow}>
                    <span className={styles.label}>{label}</span>
                    {showToggleLabel && (
                        <span className={styles.toggleLabel}>{isOpen ? "Afficher moins" : "Afficher plus"}</span>
                    )}
                </span>
            }
        >
            {children}
        </Drawer>
    )
}