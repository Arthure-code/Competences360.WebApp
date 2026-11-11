"use client"

import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import styles from "./ScoringLegend.module.css"

/**
 * Rappel de la mécanique de points — partagé entre la page d'intro d'une
 * activité (avant de commencer) et le bilan (après coup, pour expliquer un
 * score qui n'est pas un chiffre rond).
 *
 * Les chiffres viennent du serveur (GET /api/configuration), jamais d'une
 * constante locale : ce composant a pour seul rôle d'ANNONCER le barème, il
 * serait le premier endroit où un écart se verrait.
 *
 * Passé en composant client pour lire le contexte de configuration. Il ne
 * rend que du texte, la différence est sans conséquence sur l'arbre.
 *
 * Le seuil de réussite est additif : "complété" (status: "done") continue de
 * vouloir dire "chaque exercice a un résultat", peu importe le score obtenu.
 * Réussi/échoué n'est affiché nulle part ailleurs pour l'instant.
 */
export default function ScoringLegend() {
    const {
        pointsExerciceReussi,
        pointsExercicePartiel,
        seuilReussiteNiveauPourcent,
    } = usePlatformConfiguration()

    return (
        <ul className={styles.list}>
            <li>
                Réussi au 1ᵉʳ essai : {pointsExerciceReussi} point{pointsExerciceReussi > 1 ? "s" : ""}
            </li>
            <li>2ᵉ essai échoué : {String(pointsExercicePartiel).replace(".", ",")} point</li>
            <li>Réponse dévoilée : 0 point</li>
            <li>Non complété : au moins un exercice sans résultat final</li>
            <li>Complété échoué : score final sous {seuilReussiteNiveauPourcent}%</li>
            <li>Complété réussi : score final à {seuilReussiteNiveauPourcent}% ou plus</li>
        </ul>
    )
}