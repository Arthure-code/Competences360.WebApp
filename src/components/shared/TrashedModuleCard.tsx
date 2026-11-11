"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { faClock } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import CategoryTag from "@/components/shared/CategoryTag"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import { restoreModuleFromTrash } from "@/_mocks/contentModules.actions"
import { getDaysRemainingInTrash } from "@/lib/contentTrash"
import type { ContentModule } from "@/types/contentModule"
import type { Category } from "@/types/category"
import styles from "./TrashedModuleCard.module.css"

interface TrashedModuleCardProps {
    module: ContentModule
    category?: Category
    /** Dénormalisé par l'appelant : nom lisible plutôt qu'un identifiant. */
    trashedByName: string
}

/** Affiche un module en corbeille, son décompte avant purge et le bouton Restaurer. */
export default function TrashedModuleCard({ module, category, trashedByName }: TrashedModuleCardProps) {
    const router = useRouter()
    const { joursCorbeilleContenu } = usePlatformConfiguration()
    const [isRestoring, setIsRestoring] = useState(false)

    const daysRemaining = module.trashedAt
        ? getDaysRemainingInTrash(module.trashedAt, joursCorbeilleContenu)
        : 0

    async function handleRestore() {
        setIsRestoring(true)
        await restoreModuleFromTrash(module.id)
        router.refresh()
    }

    return (
        <Card padding="md" className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{module.title}</h3>
                {category && <CategoryTag label={category.label} color={category.color} iconName={category.iconName} />}
            </div>

            <p className={styles.meta}>Mis à la corbeille par {trashedByName}</p>

            <div className={styles.footer}>
                <span className={styles.countdown}>
                    <FontAwesomeIcon icon={faClock} aria-hidden="true" />
                    {daysRemaining > 0
                        ? `Supprimé définitivement dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
                        : "Sera bientôt supprimé définitivement"}
                </span>
                <Button
                    label={isRestoring ? "Restauration..." : "Restaurer"}
                    variant="outline"
                    onClick={handleRestore}
                    disabled={isRestoring}
                />
            </div>
        </Card>
    )
}
