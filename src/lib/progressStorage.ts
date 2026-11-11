import type { ExerciseAttemptState, NiveauAttemptLogEntry } from "@/hooks/useNiveauProgress"
import {
    clearNiveauProgress,
    loadManyNiveauProgress,
    loadNiveauProgress,
    saveNiveauProgress,
} from "@/_mocks/progress.actions"

export interface NiveauProgressSnapshot {
    currentIndex: number
    attempts: Record<string, ExerciseAttemptState>
    drafts: Record<string, unknown>
    /** Meilleur score jamais obtenu sur ce niveau, toutes tentatives confondues — ne régresse jamais, null tant qu'aucune tentative n'est terminée. */
    bestScore: number | null
    /** Trace des 10 dernières tentatives (numéro, score, temps, date) — usage futur formateur/gestionnaire, n'alimente jamais bestScore. */
    attemptsLog: NiveauAttemptLogEntry[]
    /** Temps actif cumulé en ms POUR LA TENTATIVE EN COURS (remis à zéro à chaque restart) */
    elapsedMs: number
    /**
     * Compteur global du nombre de tentatives, jamais réinitialisé et
     * jamais tronqué (contrairement à attemptsLog, plafonné à 10) — seule
     * source fiable pour numéroter correctement la tentative courante une
     * fois que d'anciennes entrées ont été évincées du journal.
     */
    totalAttemptsCount: number
}

/**
 * Interface volontairement minimale (load/save/clear), exactement comme
 * l'avait prévue le front pour ce remplacement — mais ASYNCHRONE.
 *
 * C'est le seul écart avec la version localStorage, et il est inévitable :
 * une lecture réseau ne peut pas rendre sa valeur dans le même tour de
 * boucle. Tout le reste est identique, et aucun composant n'a eu à changer
 * de forme — seuls les quatre appelants attendent désormais la promesse.
 */
export interface ProgressStorage {
    load(niveauId: string): Promise<NiveauProgressSnapshot | null>

    /**
     * Plusieurs activités en un seul aller-retour — indexées par identifiant,
     * les activités jamais commencées étant simplement absentes.
     *
     * N'existait pas du temps du localStorage, où lire cent fois ne coûtait
     * rien. Les écrans qui parcourent tous les niveaux de tous les modules
     * (Mon parcours, Mes réussites, Accueil) doivent passer par ici.
     */
    loadMany(niveauIds: string[]): Promise<Record<string, NiveauProgressSnapshot>>

    save(niveauId: string, snapshot: NiveauProgressSnapshot): Promise<void>
    clear(niveauId: string): Promise<void>
}

/**
 * Implémentation réelle : la progression vit sur l'API
 * (ProgressController), plus dans le navigateur.
 *
 * localProgressStorage a été retiré. Ce n'était pas seulement une question
 * de persistance : tant que la progression restait dans le localStorage de
 * l'apprenant, elle était invisible pour tout le monde d'autre. Un
 * formateur consultant un dossier, les statistiques d'un groupe, la moyenne
 * d'une organisation — tous lisaient zéro, faute de pouvoir atteindre le
 * navigateur de quelqu'un d'autre. Et un changement d'appareil effaçait
 * tout.
 *
 * Contrepartie assumée : plus de progression hors ligne. Une sauvegarde qui
 * échoue est ignorée (voir _mocks/progress.actions.ts) plutôt que remontée
 * à l'apprenant en plein exercice.
 */
export const apiProgressStorage: ProgressStorage = {
    load: (niveauId) => loadNiveauProgress(niveauId),
    loadMany: (niveauIds) => loadManyNiveauProgress(niveauIds),
    save: (niveauId, snapshot) => saveNiveauProgress(niveauId, snapshot),
    clear: (niveauId) => clearNiveauProgress(niveauId),
}