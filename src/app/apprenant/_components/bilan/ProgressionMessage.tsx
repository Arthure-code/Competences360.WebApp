"use client"

import { useEffect, useState } from "react"
import { apiProgressStorage } from "@/lib/progressStorage"
import { computeTotalScoreFromAttempts } from "@/lib/progress"
import styles from "./ProgressionMessage.module.css"

interface ProgressionMessageProps {
    niveauId: string
    maxScore: number
}

/**
 * Lit l'instantané de progression directement (pas le hook
 * useNiveauProgress : cette page n'est pas dans l'arbre client
 * d'ExercisePlayer) pour comparer le score de la tentative qui vient de se
 * terminer au meilleur score des tentatives précédentes. À ce stade,
 * restart() n'a pas encore tourné : snapshot.bestScore reflète encore
 * uniquement les tentatives d'AVANT celle-ci.
 */
export default function ProgressionMessage({ niveauId, maxScore }: ProgressionMessageProps) {
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        // Lecture asynchrone depuis que la progression vit sur l'API —
        // `annule` écarte une réponse arrivée après un changement d'activité.
        let annule = false

        void apiProgressStorage.load(niveauId).then((snapshot) => {
            if (annule || !snapshot) return

            const currentScore = computeTotalScoreFromAttempts(snapshot.attempts)
            const previousBest = snapshot.bestScore

            if (previousBest === null) {
                setMessage(`Bravo pour ce premier essai ! Score : ${currentScore}/${maxScore}`)
            } else if (currentScore > previousBest) {
                setMessage(
                    `Tu t'améliores ! Score précédent : ${previousBest}/${maxScore} et Score actuel : ${currentScore}/${maxScore}`
                )
            } else if (currentScore === previousBest) {
                setMessage(`Score actuel : ${currentScore}/${maxScore}. Tu maintiens ton meilleur score !`)
            } else {
                setMessage(
                    `Score actuel : ${currentScore}/${maxScore}. Ton meilleur score reste ${previousBest}/${maxScore}, tu peux réessayer pour améliorer ton score!`
                )
            }
        })

        return () => {
            annule = true
        }
    }, [niveauId, maxScore])

    if (!message) return null

    return <p className={styles.message}>{message}</p>
}