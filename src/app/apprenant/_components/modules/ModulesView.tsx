"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import PillGroup from "@/components/ui/PillGroup"
import EmptyState from "@/components/ui/EmptyState"
import ModuleCard from "@/components/shared/ModuleCard"
import { resolveIcon } from "@/lib/iconRegistry"
import { hydrateModuleProgress } from "@/lib/moduleProgress"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./ModulesView.module.css"

const STATUS_TABS = [
    { id: "all", label: "Tous" },
    { id: "assigned", label: "Assignés" },
    { id: "in-progress", label: "En cours" },
    { id: "todo", label: "À faire" },
    { id: "late", label: "En retard" },
    { id: "done", label: "Complétés" },
] as const

type StatusFilter = (typeof STATUS_TABS)[number]["id"]
const STATUS_IDS: readonly string[] = STATUS_TABS.map((t) => t.id)

function isStatusFilter(value: string | null): value is StatusFilter {
    return !!value && STATUS_IDS.includes(value)
}

interface ModulesViewProps {
    assignedResults: AssignedModuleResult[]
    categories: Category[]
}

export default function ModulesView({ assignedResults, categories }: ModulesViewProps) {
    const searchParams = useSearchParams()

    // 1er rendu client = modules non-hydratés (identiques au rendu serveur,
    // progression neutre) pour éviter un décalage d'hydratation React —
    // localStorage n'est lu qu'après le montage. Réhydraté aussi sur
    // reprise de focus (pas juste au montage) : le cache de navigation de
    // Next.js peut réutiliser cette page sans la remonter en y revenant
    // après avoir répondu à des exercices — sans ça l'effet de montage ne
    // se redéclencherait jamais.
    const [modules, setModules] = useState<Module[]>(() => assignedResults.map((result) => result.module))

    useEffect(() => {
        // `annule` écarte une réponse arrivée après un changement de liste
        // ou un démontage — l'hydratation est asynchrone depuis que la
        // progression vit sur l'API (voir lib/progressStorage.ts).
        let annule = false

        function hydrate() {
            void Promise.all(
                assignedResults.map((result) =>
                    hydrateModuleProgress(result.module, result.dueDate))
            ).then((hydrates) => {
                if (!annule) setModules(hydrates)
            })
        }

        hydrate()
        window.addEventListener("focus", hydrate)
        document.addEventListener("visibilitychange", hydrate)

        return () => {
            annule = true
            window.removeEventListener("focus", hydrate)
            document.removeEventListener("visibilitychange", hydrate)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedResults])

    // Construites depuis `categories` (dynamique, passé par le Server
    // Component parent) plutôt qu'une liste figée — n'importe quelle
    // catégorie ajoutée au mock apparaît ici automatiquement.
    const categoryPills = useMemo(
        () => [
            { id: "all", label: "Toutes les catégories" },
            ...categories.map((category) => ({
                id: category.id,
                label: category.label,
                icon: resolveIcon(category.iconName),
            })),
        ],
        [categories]
    )
    const categoryIds = useMemo(() => categories.map((c) => c.id), [categories])

    // Valeur initiale lue depuis l'URL (?statut=, ?categorie=) — utile pour
    // les liens "Voir tout" (Accueil → Assignés) et les cartes de catégorie
    // (Accueil → catégorie précise). Retombe sur "all" si absent/invalide.
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
        const param = searchParams.get("statut")
        return isStatusFilter(param) ? param : "all"
    })

    const [categoryFilter, setCategoryFilter] = useState<string>(() => {
        const param = searchParams.get("categorie")
        return param && categoryIds.includes(param) ? param : "all"
    })

    const filteredModules = useMemo(() => {
        return modules.filter((mod) => {
            const statusMatch =
                statusFilter === "all" ||
                (statusFilter === "assigned" && mod.assigned) ||
                mod.status === statusFilter

            const categoryMatch = categoryFilter === "all" || mod.categoryId === categoryFilter

            return statusMatch && categoryMatch
        })
    }, [modules, statusFilter, categoryFilter])

    return (
        <div className={styles.page}>
            <PageHeader title="Modules" subtitle="Explorez notre catalogue de formation" />

            <div className={styles.filters}>
                <Tabs
                    items={STATUS_TABS}
                    active={statusFilter}
                    onChange={(id) => setStatusFilter(id as StatusFilter)}
                />
                <PillGroup items={categoryPills} active={categoryFilter} onChange={setCategoryFilter} />
            </div>

            {filteredModules.length === 0 ? (
                <EmptyState
                    icon={faMagnifyingGlass}
                    title="Aucun module ne correspond à ces filtres."
                    description="Essayez une autre combinaison de statut et de catégorie."
                />
            ) : (
                <div className={styles.grid}>
                    {filteredModules.map((mod) => (
                        <ModuleCard
                            key={mod.id}
                            module={mod}
                            category={categories.find((c) => c.id === mod.categoryId)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}