/**
 * Règles de score — le SERVEUR en est la source (section « Progression » de
 * appsettings.json, servie par GET /api/configuration).
 *
 * Ce fichier ne porte plus de chiffres. Il portait EXERCISE_FULL_SCORE,
 * EXERCISE_PARTIAL_SCORE et NIVEAU_PASS_THRESHOLD_PERCENT, dupliqués côté
 * API : les deux copies décidaient chacune de leur côté, et la divergence se
 * voyait — un moment fort détecté par le serveur pouvait contredire ce que
 * le navigateur venait d'afficher.
 *
 * Où lire ces valeurs désormais :
 * - composant CLIENT → `usePlatformConfiguration()`
 *   (components/shared/ConfigurationProvider.tsx) ;
 * - composant SERVEUR ou lib appelée depuis l'un d'eux →
 *   `getPlatformConfiguration()` (_mocks/configuration.mock.ts).
 *
 * La notation, elle non plus, ne se fait plus ici : `useNiveauProgress`
 * appelle `POST /api/apprentissage/exercices/cle/{key}/repondre` et reprend
 * le score que le serveur lui rend. Le catalogue ne porte plus les solutions.
 * Ce qui subsiste ci-dessous est un seuil de LECTURE, appliqué à des scores
 * déjà calculés ailleurs.
 */

/**
 * Seuil de réussite d'un NIVEAU (pas d'un exercice) — additif, pas un
 * remplacement de `status: "done"` (Niveau/Module) : "done" continue de
 * vouloir dire "chaque exercice a un résultat final", peu importe si ce
 * résultat est bon ou non.
 *
 * `seuilPourcent` vient de la configuration serveur ; l'appelant le fournit
 * plutôt que cette fonction n'aille le chercher, pour qu'elle reste pure et
 * appelable des deux côtés (serveur comme client).
 */
export function isNiveauPassed(score: number, maxScore: number, seuilPourcent: number): boolean {
    if (maxScore === 0) return false
    return (score / maxScore) * 100 >= seuilPourcent
}