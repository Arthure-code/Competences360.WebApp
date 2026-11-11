import type { Niveau } from "@/types/module"
import { routes } from "@/constants/routes"

export interface NiveauCta {
    label: string
    href: string
    disabled: boolean
}

function firstExerciseSlug(niveau: Niveau): string | undefined {
    return niveau.exercises[0]?.slug
}

/**
 * Id de l'exercice où l'apprenant s'était arrêté. `lastExerciseIndex` est
 * pour l'instant un champ de mock (voir types/module.ts) — une fois le
 * ExercisePlayer branché, cette valeur viendra du vrai suivi de progression
 * par apprenant plutôt que d'être stockée sur le contenu du niveau.
 */
function resumeExerciseSlug(niveau: Niveau): string | undefined {
    if (niveau.lastExerciseIndex === null) return firstExerciseSlug(niveau)
    return niveau.exercises[niveau.lastExerciseIndex]?.slug ?? firstExerciseSlug(niveau)
}

/**
 * Calcule le libellé + la destination du bouton d'action d'un niveau, selon
 * son état. Utilisé à la fois par la ligne "niveau" de la page module et
 * par le CTA principal de la page d'entrée du niveau — un seul endroit qui
 * décide "où envoyer l'apprenant".
 */
export function getNiveauCta(
    moduleSlug: string,
    niveau: Niveau,
    options?: { fullLabel?: boolean }
): NiveauCta {
    if (niveau.status === "done") {
        return {
            label: "Résultat",
            href: routes.apprenant.modules.bilan(moduleSlug, niveau.slug),
            disabled: false,
        }
    }

    if (niveau.status === "in-progress") {
        const exerciseSlug = resumeExerciseSlug(niveau)
        return {
            label: "Continuer",
            href: exerciseSlug ? routes.apprenant.modules.exercice(moduleSlug, niveau.slug, exerciseSlug) : "",
            disabled: !exerciseSlug,
        }
    }

    // Jamais commencée : l'apprenant n'a encore rien vu de cette activité
    // (ni les instructions, ni "Ce que vous allez pratiquer") — on l'envoie
    // sur sa page d'intro, pas directement en question 1. "Continuer",
    // lui, saute droit à l'exercice : l'intro a déjà été vue une fois.
    return {
        label: options?.fullLabel ? "Commencer le niveau" : "Commencer",
        href: routes.apprenant.modules.niveau(moduleSlug, niveau.slug),
        disabled: false,
    }
}

/**
 * Libellé de la ligne d'infos avant le bouton (page d'entrée du niveau) :
 * - à faire : nombre total d'exercices
 * - en cours : position actuelle / total
 * - terminé : idem à faire, le score prend le relai pour montrer la complétion
 */
export function getNiveauProgressLabel(niveau: Niveau): string {
    const total = niveau.intro.exerciseCount
    if (niveau.status === "in-progress") {
        const current = (niveau.lastExerciseIndex ?? 0) + 1
        return `${current}/${total} exercices`
    }
    return `${total} exercice${total > 1 ? "s" : ""}`
}