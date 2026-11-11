"use client"

import { useId, useState } from "react"

interface UseDrawerOptions {
    /** Mode contrôlé : si fourni, l'appelant gère l'état ouvert/fermé */
    open?: boolean
    /** Mode non-contrôlé : état initial si `open` n'est pas fourni */
    defaultOpen?: boolean
    /** Appelé à chaque tentative de bascule, dans les deux modes */
    onOpenChange?: (open: boolean) => void
    /** Id stable pour lier aria-controls / région (utile en liste, ex. FAQ) */
    id?: string
}

/**
 * Logique d'un tiroir/accordéon, sans aucune opinion sur le markup.
 * `Drawer` (composant) l'utilise pour son rendu par défaut, mais n'importe
 * quel composant peut s'en servir pour construire sa propre apparence
 * (ex: SectionHeader avec juste une flèche, sans bordure ni fond).
 */
export function useDrawer({ open, defaultOpen = false, onOpenChange, id }: UseDrawerOptions = {}) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const generatedId = useId()
    const contentId = `drawer-content-${id ?? generatedId}`

    function toggle() {
        const next = !isOpen
        if (!isControlled) setInternalOpen(next)
        onOpenChange?.(next)
    }

    return {
        isOpen,
        toggle,
        contentId,
        /** À étaler sur le bouton/élément cliquable */
        triggerProps: {
            onClick: toggle,
            "aria-expanded": isOpen,
            "aria-controls": contentId,
        },
        /** À étaler sur le conteneur du contenu affiché/masqué */
        contentProps: {
            id: contentId,
            role: "region" as const,
        },
    }
}