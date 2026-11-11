"use client"

import { useEffect, useState } from "react"
import { hydrateModuleProgress } from "@/lib/moduleProgress"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Module } from "@/types/module"

/**
 * Généralisation de useHydratedModule (singulier) pour une LISTE de
 * modules — cette même logique (focus + visibilitychange, voir le
 * commentaire original) était dupliquée dans 5 fichiers différents
 * (ModulesView, DashboardView, ParcoursView, ReussitesView,
 * GroupModulesSection), chacun avec son propre useEffect copié-collé,
 * construits séparément pendant la migration apprenant. Centralisé ici,
 * les 5 appellent ce hook au lieu de réimplémenter le listener.
 */
export function useHydratedModules(assignedResults: AssignedModuleResult[]): Module[] {
    const [modules, setModules] = useState(() => assignedResults.map((r) => r.module))

    // L'hydratation est devenue asynchrone (la progression vit sur l'API,
    // voir lib/progressStorage.ts) : `annule` écarte une réponse qui
    // arriverait après un changement de liste ou un démontage — sans quoi
    // un retour de focus rapide pourrait réafficher l'état précédent.
    useEffect(() => {
        let annule = false

        function hydrate() {
            Promise.all(
                assignedResults.map((r) =>
                    hydrateModuleProgress(r.module, r.dueDate, r.niveauDueDates))
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

    return modules
}