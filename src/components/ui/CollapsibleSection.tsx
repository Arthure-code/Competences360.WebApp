"use client"

import type { ReactNode } from "react"
import { useDrawer } from "@/hooks/useDrawer"
import PageSubheader from "@/components/ui/PageSubheader"

interface CollapsibleSectionProps {
    title: string
    count?: number
    countClassName?: string
    subtitle?: string
    /**
     * Si fourni, l'en-tête navigue vers cette route ("Voir tout" fixe,
     * icône décorative) au lieu de replier/déplier — le contenu reste
     * alors toujours affiché, `defaultOpen` est ignoré.
     */
    actionHref?: string
    /**
     * Alternative à actionHref : déclenche un comportement personnalisé
     * (ex. ouvrir un SidePanel) au lieu de naviguer ou de replier — le
     * contenu reste toujours affiché, comme actionHref. Prioritaire sur
     * actionHref si les deux sont fournis (ne devrait pas arriver).
     */
    onAction?: () => void
    /** Libellé en mode lien/action (actionHref ou onAction fourni) — défaut "Voir tout" */
    actionLabel?: string
    /** Libellé en mode repli quand fermé — défaut "Voir tout" */
    closedLabel?: string
    /** Libellé en mode repli quand ouvert — défaut "Réduire" */
    openLabel?: string
    muted?: boolean
    /** Ouvert par défaut au premier rendu — ignoré si actionHref/onAction est fourni (toujours affiché) */
    defaultOpen?: boolean
    className?: string
    titleClassName?: string
    children: ReactNode
}

/**
 * Trois comportements selon ce qui est fourni :
 * - actionHref : en-tête statique qui navigue ailleurs, contenu toujours affiché.
 * - onAction : en-tête statique qui déclenche un comportement personnalisé
 *   (ex. ouvrir un SidePanel), contenu toujours affiché — même chrono
 *   qu'actionHref, juste un bouton plutôt qu'un lien.
 * - ni l'un ni l'autre : section repliable localement, icône qui tourne,
 *   libellé qui bascule "Voir tout" / "Réduire" selon l'état.
 */
export default function CollapsibleSection({
    title,
    count,
    countClassName,
    subtitle,
    actionHref,
    onAction,
    actionLabel = "Voir tout",
    closedLabel = "Voir tout",
    openLabel = "Réduire",
    muted,
    defaultOpen = true,
    className,
    titleClassName,
    children,
}: CollapsibleSectionProps) {
    const { isOpen, toggle, contentId } = useDrawer({ defaultOpen })

    if (actionHref) {
        return (
            <section className={className}>
                <PageSubheader
                    title={title}
                    count={count}
                    countClassName={countClassName}
                    subtitle={subtitle}
                    actionLabel={actionLabel}
                    actionHref={actionHref}
                    actionMode="link"
                    muted={muted}
                    titleClassName={titleClassName}
                />
                {children}
            </section>
        )
    }

    if (onAction) {
        return (
            <section className={className}>
                <PageSubheader
                    title={title}
                    count={count}
                    countClassName={countClassName}
                    subtitle={subtitle}
                    actionLabel={actionLabel}
                    onActionClick={onAction}
                    actionMode="action"
                    muted={muted}
                    titleClassName={titleClassName}
                />
                {children}
            </section>
        )
    }

    return (
        <section className={className}>
            <PageSubheader
                title={title}
                count={count}
                countClassName={countClassName}
                subtitle={subtitle}
                actionLabel={isOpen ? openLabel : closedLabel}
                actionMode="toggle"
                onActionClick={toggle}
                isOpen={isOpen}
                actionAriaControls={contentId}
                muted={muted}
                titleClassName={titleClassName}
            />
            {isOpen && <div id={contentId}>{children}</div>}
        </section>
    )
}