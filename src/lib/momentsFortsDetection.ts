import { getMomentFortDefinition } from "@/constants/momentsFortsDefinitions"
import type { ApprenantModuleProgressEntry } from "@/types/apprenantModuleProgress"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { Module } from "@/types/module"
import type { MomentFortDisplay } from "@/lib/rewards"

/**
 * Ne restent ici que les moments forts DÉRIVÉS : ceux qui se lisent dans
 * l'état final, sans qu'aucun événement ait eu à être enregistré.
 *
 * detectEventMoments a été retirée. Les cinq moments événementiels comparent
 * l'AVANT et l'APRÈS d'une mise à jour ; ils étaient détectés en relisant un
 * tableau en mémoire côté Next, qui n'existe plus. La détection vit
 * désormais dans ApprenantProgressionService (API), dans la même opération
 * que l'écriture qu'elle observe — le seul endroit qui voie réellement la
 * transition. Les seuils y sont transposés à l'identique
 * (Constants/ProgressionConstants.cs) : les changer d'un seul côté ferait
 * apparaître puis disparaître un moment fort au rechargement.
 */

/**
 * Module parfait — dérivé, pas un événement enregistré : ne dépend que de
 * l'état final (chaque niveau du module à bestScore === maxScore), pas
 * d'une transition historique. Appelée par ReussitesView à l'affichage,
 * même principe que badges/certificats.
 */
export function deriveModuleParfaitMoments(
    modules: Module[],
    progressEntries: ApprenantModuleProgressEntry[]
): MomentFortDisplay[] {
    return modules
        .filter((module) => module.status === "done" && module.niveaux.length > 0)
        .filter((module) =>
            module.niveaux.every((n) => n.intro.currentScore !== null && n.intro.currentScore === n.intro.maxScore)
        )
        .map((module) => {
            const dates = module.niveaux
                .map((n) => progressEntries.find((e) => e.niveauId === n.id)?.firstCompletedAt)
                .filter((d): d is string => Boolean(d))
                .sort()
            const definition = getMomentFortDefinition("module-parfait")
            return {
                label: definition.label,
                description: definition.description,
                icon: definition.icon,
                earnedAt: dates.at(-1) ?? new Date().toISOString(),
            }
        })
}

/** Rattrapage réussi — dérivé : module complété après sa dueDate (voir Assignment). */
export function deriveRattrapageReussiMoments(
    modules: Module[],
    assignedResults: AssignedModuleResult[],
    progressEntries: ApprenantModuleProgressEntry[]
): MomentFortDisplay[] {
    return modules
        .filter((module) => module.status === "done" && module.niveaux.length > 0)
        .flatMap((module) => {
            const assignment = assignedResults.find((r) => r.module.id === module.id)
            if (!assignment?.dueDate) return []

            const dates = module.niveaux
                .map((n) => progressEntries.find((e) => e.niveauId === n.id)?.firstCompletedAt)
                .filter((d): d is string => Boolean(d))
                .sort()
            const completedAt = dates.at(-1)
            if (!completedAt) return []
            if (new Date(completedAt).getTime() <= new Date(assignment.dueDate).getTime()) return []

            const definition = getMomentFortDefinition("rattrapage-reussi")
            return [{ label: definition.label, description: definition.description, icon: definition.icon, earnedAt: completedAt }]
        })
}