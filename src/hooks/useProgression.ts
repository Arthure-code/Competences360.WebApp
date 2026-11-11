"use client"

import { useEffect, useState } from "react"
import type { Module } from "@/types/module"
import { apiProgressStorage, type NiveauProgressSnapshot } from "@/lib/progressStorage"

export interface ProgressionStats {
    totalElapsedMs: number
    averageScorePercent: number
    completedExercisesCount: number
    totalAttemptsCount: number
}

const EMPTY_STATS: ProgressionStats = {
    totalElapsedMs: 0,
    averageScorePercent: 0,
    completedExercisesCount: 0,
    totalAttemptsCount: 0,
}

/**
 * Agrège les instantanés de progression (un par activité, voir
 * lib/progressStorage.ts et useNiveauProgress.ts) à travers tous les
 * niveaux de `modules` pour produire les stats globales de l'apprenant
 * ("Statistiques personnelles") — un seul endroit qui fait cette somme,
 * pour ne pas la refaire à chaque page qui en a besoin.
 *
 * La lecture est un appel réseau : ce hook renvoie EMPTY_STATS le temps du
 * rendu initial, puis se met à jour une fois les instantanés arrivés. Tous
 * sont demandés en UN aller-retour (loadMany) — un apprenant avec six
 * modules de six activités en enchaînerait sinon trente-six.
 */
export function useProgression(modules: Module[]): ProgressionStats {
    const [stats, setStats] = useState<ProgressionStats>(EMPTY_STATS)

    useEffect(() => {
        let annule = false

        // Même dérivation que useNiveauProgress (hooks/useNiveauProgress.ts)
        // — exercises[0].niveauId, pas niveau.id directement.
        const niveaux = modules.flatMap((module) =>
            module.niveaux.map((niveau) => ({
                niveau,
                cle: niveau.exercises[0]?.niveauId ?? niveau.id,
            }))
        )

        apiProgressStorage.loadMany(niveaux.map(({ cle }) => cle))
            .then((instantanes) => {
                if (annule) return

                let totalElapsedMs = 0
                let totalAttemptsCount = 0
                let completedExercisesCount = 0
                const scorePercents: number[] = []

                niveaux.forEach(({ niveau, cle }) => {
                    const snapshot: NiveauProgressSnapshot | undefined = instantanes[cle]
                    if (!snapshot) return

                    totalElapsedMs += snapshot.elapsedMs

                    for (const attempt of Object.values(snapshot.attempts)) {
                        totalAttemptsCount += attempt.attemptsCount
                        if (attempt.result !== null) completedExercisesCount += 1
                    }

                    // `!== null` ne suffit pas : un instantané dépourvu du
                    // champ le laisse à `undefined`, qui franchit ce test et
                    // donne un NaN à la division. C'est ce qui affichait
                    // « Moyenne globale : NaN % ». On exige un nombre.
                    if (typeof snapshot.bestScore === "number" && niveau.intro.maxScore > 0) {
                        scorePercents.push(Math.round((snapshot.bestScore / niveau.intro.maxScore) * 100))
                    }
                })

                const averageScorePercent =
                    scorePercents.length === 0
                        ? 0
                        : Math.round(scorePercents.reduce((sum, p) => sum + p, 0) / scorePercents.length)

                setStats({ totalElapsedMs, averageScorePercent, completedExercisesCount, totalAttemptsCount })
            })

        return () => {
            annule = true
        }
        // Le tableau `modules` est recréé à chaque rendu côté appelant (filter/import) ;
        // on ne dépend que de sa longueur pour éviter une boucle de recalcul inutile.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modules.length])

    return stats
}