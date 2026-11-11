"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Card from "@/components/ui/Card"
import CategoryTag from "@/components/shared/CategoryTag"
import { createModuleFromGlobal } from "@/_mocks/moduleVersions.actions"
import { getFullName } from "@/lib/user"
import { getCurrentSession } from "@/_mocks/users.mock"
import { routes } from "@/constants/routes"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { Category } from "@/types/category"
import styles from "./GlobalCatalogCard.module.css"

interface GlobalCatalogCardProps {
    /** Contenu de base plateforme, plus l'ancien Module (modules.mock.ts, retiré) — voir platformTemplates.mock.ts */
    template: PlatformTemplate
    category?: Category
    organizationId: string
    userId: string
    role: "formateur" | "gestionnaire"
}

/**
 * Onglet "Modèles" — contenu fourni par la plateforme, pas encore forké
 * dans l'org (voir getForkableModules). Contrairement à ContentModuleCard,
 * pas un lien : cliquer fork immédiatement (createModuleFromGlobal) et
 * redirige vers l'éditeur — même geste que le sélectionner dans
 * ForkModulePicker, juste accessible directement depuis la grille.
 *
 * Card n'a pas de prop `disabled` — la garde contre le double-clic se
 * fait avec une ref (pas un state, pour être synchrone dès le 1er clic,
 * avant même le prochain rendu) plutôt que côté DOM.
 */
export default function GlobalCatalogCard({ template, category, organizationId, userId, role }: GlobalCatalogCardProps) {
    const router = useRouter()
    const [isForking, setIsForking] = useState(false)
    const hasStartedRef = useRef(false)

    async function handleFork() {
        if (hasStartedRef.current) return
        hasStartedRef.current = true
        setIsForking(true)

        const { user } = await getCurrentSession()
        const result = await createModuleFromGlobal({
            sourceGlobalModuleId: template.id,
            organizationId,
            createdByUserId: userId,
            createdByName: getFullName(user),
            changeNote: "Version initiale",
        })
        if (result) {
            router.push(routes[role].contenu.edit(result.module.id, result.version.id))
        } else {
            hasStartedRef.current = false
            setIsForking(false)
        }
    }

    return (
        <Card padding="md" onClick={handleFork} className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{template.content.title}</h3>
                {category && <CategoryTag label={category.label} color={category.color} iconName={category.iconName} />}
            </div>
            <p className={styles.description}>{template.content.description}</p>
            <span className={styles.meta}>
                {isForking
                    ? "Création..."
                    : `${template.content.niveaux.length} activité${template.content.niveaux.length > 1 ? "s" : ""}`}
            </span>
        </Card>
    )
}