"use client"

import { useEffect, useMemo, useState } from "react"
import type { Exercise } from "@/types/exercise"
import { type ExerciseAnswer } from "@/lib/exerciseValidation"
import { corrigerExercice } from "@/_mocks/exerciceCorrection.actions"
import { apiProgressStorage, type ProgressStorage } from "@/lib/progressStorage"
import { upsertNiveauProgress } from "@/_mocks/apprenantModuleProgress.actions"
import { logNiveauAttempt } from "@/_mocks/apprenantNiveauAttempts.actions"
import { getCurrentSession } from "@/_mocks/users.mock"

export type ExerciseResult = "success" | "revealed"

export interface ExerciseAttemptState {
    attemptsCount: number
    lastAnswer: ExerciseAnswer | null
    lastAnswerCorrect: boolean | null
    /** null tant qu'il n'y a pas de résultat final — voir "Logique de réussite" dans EXERCISE_TYPES.md */
    result: ExerciseResult | null
    score: number | null
    /**
     * Rendue par le SERVEUR à la finalisation, dans la forme d'une réponse
     * d'apprenant. Le catalogue ne portant plus les solutions, c'est la seule
     * source pour afficher « la bonne réponse était… ».
     */
    bonneReponse?: ExerciseAnswer | null
    /** Explication de la correction, rendue par le serveur à la finalisation. */
    feedbackCorrection?: string | null
}

/** Une ligne de trace pour une tentative de niveau terminée — voir `attemptsLog` */
export interface NiveauAttemptLogEntry {
    /** Numéro global de la tentative — dérivé de totalAttemptsCount, jamais recalculé depuis la position dans ce tableau (qui, lui, est plafonné et tronqué) */
    attemptNumber: number
    score: number
    /** Temps passé pendant CETTE tentative (depuis le restart précédent), pas cumulatif sur tout le niveau */
    timeSpentMs: number
    completedAt: string
}

/**
 * "en-cours" couvre maintenant deux cas : une tentative posée (pas encore
 * finale) OU un brouillon jamais soumis (choix fait, pas encore validé) —
 * les deux disent la même chose à l'apprenant : "j'ai commencé ici, rien
 * n'est perdu". Pas d'état "passé" séparé : visuellement ça ressemblait à
 * un verrou (pointillé) alors que l'exercice reste cliquable comme les
 * autres.
 */
export type StepperStatus = "a-faire" | "en-cours" | "reussi" | "echoue"

/**
 * Le serveur rend `bonneReponse` dans la forme d'une réponse d'apprenant,
 * mais SANS le discriminant `type` : il serait redondant sur le fil, le
 * client connaît déjà le type de l'exercice qu'il affiche.
 *
 * On l'appose ici, à l'entrée, une seule fois — sinon chaque consommateur
 * (les six renderers, le panneau de correction) devrait le refaire, et le
 * premier qui l'oublie ne colore plus rien, sans erreur.
 */
function avecDiscriminant(
    bonneReponse: unknown,
    type: Exercise["type"],
): ExerciseAnswer | null {
    if (!bonneReponse || typeof bonneReponse !== "object") return null

    return { ...(bonneReponse as object), type } as ExerciseAnswer
}

const EMPTY_ATTEMPT: ExerciseAttemptState = {
    attemptsCount: 0,
    lastAnswer: null,
    lastAnswerCorrect: null,
    result: null,
    score: null,
}

/**
 * Nombre de tentatives de niveau conservées dans `attemptsLog`, la plus
 * ancienne effacée en premier au-delà — trace purement informative pour un
 * futur tableau de bord formateur/gestionnaire, sans effet sur `bestScore`
 * (qui, lui, ne s'efface jamais). Voir la discussion produit associée.
 */
const MAX_ATTEMPTS_LOG = 10

interface UseNiveauProgressOptions {
    exercises: Exercise[]
    /** Index (0-based) où reprendre — vient de Niveau.lastExerciseIndex */
    initialIndex?: number
    /** Injectable pour les tests ; par défaut l'API (voir lib/progressStorage.ts). */
    storage?: ProgressStorage
}

/**
 * Délai avant qu'un changement parte vers l'API. Le chronomètre avance
 * chaque seconde et chaque tick change l'état : sans ce regroupement, une
 * activité de dix minutes déclencherait six cents requêtes. Assez court
 * pour qu'une réponse soumise soit enregistrée avant que l'apprenant ait
 * lu la correction.
 */
const SAVE_DEBOUNCE_MS = 1500

export function useNiveauProgress({
    exercises,
    initialIndex = 0,
    storage = apiProgressStorage,
}: UseNiveauProgressOptions) {
    // Le barème n'est plus lu ici : c'est le serveur qui note. Il reste servi
    // par GET /api/configuration pour que ScoringLegend puisse EXPLIQUER le
    // barème à l'apprenant — expliquer, pas appliquer.
    const niveauId = exercises[0]?.niveauId ?? "unknown"
    // Dénormalisé sur chaque exercice par buildStructuralModule (voir
    // ExerciseBase.moduleId, types/exercice.ts) — dérivé ici de la même
    // façon que niveauId, aucun appelant du hook n'a besoin de le fournir.
    const moduleId = exercises[0]?.moduleId ?? "unknown"
    const [isHydrated, setIsHydrated] = useState(false)

    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [attempts, setAttempts] = useState<Record<string, ExerciseAttemptState>>({})
    // Brouillons non soumis, par exerciseId — remontés ici (plutôt que dans
    // un useState local à chaque renderer) pour survivre à la navigation
    // entre exercices via le stepper.
    const [drafts, setDrafts] = useState<Record<string, unknown>>({})
    const [isPanelOpen, setPanelOpen] = useState(false)
    const [bestScore, setBestScore] = useState<number | null>(null)
    const [attemptsLog, setAttemptsLog] = useState<NiveauAttemptLogEntry[]>([])
    const [elapsedMs, setElapsedMs] = useState(0)
    /** Jamais réinitialisé, jamais tronqué — voir NiveauProgressSnapshot.totalAttemptsCount */
    const [totalAttemptsCount, setTotalAttemptsCount] = useState(0)
    /**
     * Refus du serveur lors d'une correction — réseau coupé, exercice hors de
     * portée, déjà terminé. Distinct d'une mauvaise réponse : rien n'est
     * compté, rien n'est finalisé, l'apprenant peut réessayer.
     */
    const [erreurCorrection, setErreurCorrection] = useState<string | null>(null)

    // Réhydratation depuis le stockage au montage — une seule fois par niveau.
    // setIsHydrated(true) DOIT être un vrai setState (pas une ref) pour que
    // React regroupe cette mise à jour avec les autres (setAttempts, etc.)
    // dans le MÊME rendu — sinon l'effet de sauvegarde juste en dessous,
    // qui s'exécute dans la même passe, verrait le "déblocage" avant que
    // les valeurs hydratées soient réellement appliquées, et sauvegarderait
    // par-dessus l'état encore vide du tout premier rendu.
    //
    // Le chargement est ASYNCHRONE depuis que la progression vit sur l'API :
    // `annule` écarte une réponse arrivée trop tard (changement d'activité en
    // cours de route), qui écraserait l'état de la nouvelle avec celui de
    // l'ancienne. setIsHydrated est appelé dans les deux cas — même si le
    // chargement échoue, l'apprenant doit pouvoir travailler.
    useEffect(() => {
        let annule = false

        storage.load(niveauId).then((snapshot) => {
            if (annule) return

            if (snapshot) {
                setCurrentIndex(snapshot.currentIndex)
                setAttempts(snapshot.attempts)
                setDrafts(snapshot.drafts)
                // ?? plutôt que valeur par défaut dans la déstructuration : un
                // snapshot sauvegardé avant l'ajout de ces champs ne les contient
                // pas du tout (undefined), pas juste avec une valeur vide.
                setBestScore(snapshot.bestScore ?? null)
                setAttemptsLog(snapshot.attemptsLog ?? [])
                setElapsedMs(snapshot.elapsedMs ?? 0)
                setTotalAttemptsCount(snapshot.totalAttemptsCount ?? 0)
            }

            setIsHydrated(true)
        })

        return () => {
            annule = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [niveauId])

    // Sauvegarde à chaque changement, mais seulement après la réhydratation
    // — sinon on écraserait un snapshot existant avec un état vide au tout
    // premier rendu. isHydrated dans les dépendances : cet effet se
    // redéclenche PROPREMENT une fois l'hydratation appliquée (rendu
    // séparé), au lieu de risquer de tourner dans la même passe que
    // l'effet ci-dessus avec des valeurs encore périmées.
    //
    // Débouncée depuis que l'écriture part sur le réseau : le nettoyage de
    // l'effet annule le minuteur en attente, donc seul le dernier état d'une
    // rafale est envoyé. Le démontage annule aussi — une activité quittée
    // aussitôt ne laisse pas une requête partir derrière elle.
    //
    // `elapsedMs` est capturé par FERMETURE, jamais mis en dépendance — même
    // règle que l'effet de synchronisation plus bas, et pour une raison plus
    // grave ici. Le chronomètre l'incrémente chaque seconde ; l'y mettre
    // relançait le débounce de 1,5 s toutes les 1 s, si bien qu'il n'arrivait
    // JAMAIS à terme : tant que le chronomètre tournait, aucune sauvegarde ne
    // partait. Les réponses ne s'enregistraient qu'aux moments où les ticks
    // cessaient — activité terminée, ou onglet masqué. Quitter en cours de
    // route perdait tout depuis le dernier arrêt.
    //
    // Le débounce se déclenche donc sur les VRAIS changements — réponse
    // soumise, brouillon modifié, exercice suivant — et le temps écoulé part
    // avec, à sa valeur du moment.
    useEffect(() => {
        if (!isHydrated) return

        const minuteur = setTimeout(() => {
            storage.save(niveauId, {
                currentIndex,
                attempts,
                drafts,
                bestScore,
                attemptsLog,
                elapsedMs,
                totalAttemptsCount,
            })
        }, SAVE_DEBOUNCE_MS)

        return () => clearTimeout(minuteur)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        niveauId,
        isHydrated,
        currentIndex,
        attempts,
        drafts,
        bestScore,
        attemptsLog,
        totalAttemptsCount,
        storage,
    ])

    const currentExercise = exercises[currentIndex] as Exercise | undefined

    function getAttempt(exerciseId: string): ExerciseAttemptState {
        return attempts[exerciseId] ?? EMPTY_ATTEMPT
    }

    /** Un exercice avec un résultat final n'est plus modifiable (voir EXERCISE_TYPES.md). */
    function isLocked(exerciseId: string): boolean {
        return getAttempt(exerciseId).result !== null
    }

    function getDraft<T = unknown>(exerciseId: string): T | undefined {
        return drafts[exerciseId] as T | undefined
    }

    function setDraft(exerciseId: string, value: unknown) {
        setDrafts((prev) => ({ ...prev, [exerciseId]: value }))
    }

    function clearDraft(exerciseId: string) {
        setDrafts((prev) => {
            if (!(exerciseId in prev)) return prev
            const next = { ...prev }
            delete next[exerciseId]
            return next
        })
    }

    const currentAttempt = currentExercise ? getAttempt(currentExercise.id) : EMPTY_ATTEMPT
    const isCurrentLocked = currentExercise ? isLocked(currentExercise.id) : false

    /** true une fois que chaque exercice du niveau a un résultat final — arrête le chronomètre, débloque le Bilan. */
    const hasCompleted = useMemo(
        () => exercises.length > 0 && exercises.every((exercise) => getAttempt(exercise.id).result !== null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [exercises, attempts]
    )

    /**
     * true si, à cette complétion, chaque exercice a été réussi dès sa 1ère
     * soumission (result === "success" ET attemptsCount === 1) — sert à
     * détecter une série de réussites propres (moments forts). Recalculé à
     * chaque changement d'attempts, mais seulement pertinent au moment où
     * hasCompleted devient vrai (voir l'effet de synchronisation
     * ci-dessous).
     */
    const wasCleanPass = useMemo(
        () => exercises.every((exercise) => {
            const attempt = getAttempt(exercise.id)
            return attempt.result === "success" && attempt.attemptsCount === 1
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [exercises, attempts]
    )

    /**
     * Synchronise vers apprenantModuleProgress.actions.ts (le pendant côté
     * "serveur" de ce hook) à chaque fois que hasCompleted ou bestScore
     * change, une fois hydraté seulement — même garde que l'effet de
     * sauvegarde localStorage ci-dessus. localStorage reste la source pour
     * l'affichage immédiat ; ce nouvel appel alimente tout ce qui doit être
     * vu par quelqu'un d'autre que l'apprenant (Statistiques, dossier
     * apprenant, moments forts). userId résolu via getCurrentSession()
     * (appelable côté client, voir users.mock.ts) plutôt que passé en
     * prop : aucun appelant du hook (ExercisePlayer, BilanNiveau,
     * TestModeRenderer) n'a besoin de le connaître.
     */
    useEffect(() => {
        if (!isHydrated || moduleId === "unknown" || niveauId === "unknown") return
        const maxScore = exercises.length
        // elapsedMs capturé ici via closure (valeur du rendu courant), PAS
        // dans le tableau de dépendances ci-dessous — elapsedMs change
        // chaque seconde (voir le chronomètre plus bas), l'y ajouter
        // redéclencherait cette synchronisation vers le serveur à chaque
        // tick, une vraie régression de performance pour rien : la valeur
        // n'a besoin d'être à jour qu'aux mêmes moments que hasCompleted/
        // bestScore changent déjà (une vraie réponse soumise), pas en continu.
        getCurrentSession().then(({ user }) => {
            upsertNiveauProgress({
                userId: user.id,
                moduleId,
                niveauId,
                isDone: hasCompleted,
                bestScore,
                maxScore,
                totalAttemptsCount,
                wasCleanPass,
                timeSpentMs: elapsedMs,
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated, moduleId, niveauId, hasCompleted, bestScore])

    /**
     * Chronomètre "temps actif" : démarre dès qu'un exercice est affiché,
     * s'arrête une fois le niveau complété. Un intervalle d'1s tourne tant
     * que l'onglet est visible ; il est coupé (pas juste ignoré) sur
     * `visibilitychange` pour ne compter aucune seconde pendant que
     * l'apprenant a quitté l'onglet.
     *
     * Ces ticks ne déclenchent AUCUNE sauvegarde, contrairement à ce que
     * disait ce commentaire : `elapsedMs` est exclu des dépendances de
     * l'effet de sauvegarde, sans quoi le débounce de 1,5 s était relancé
     * toutes les secondes et n'aboutissait jamais. La valeur est emportée par
     * la prochaine sauvegarde réelle — celle d'une réponse ou d'un brouillon.
     */
    useEffect(() => {
        if (!isHydrated || hasCompleted || !currentExercise) return

        let intervalId: ReturnType<typeof setInterval> | null = null

        function start() {
            if (intervalId || document.hidden) return
            intervalId = setInterval(() => setElapsedMs((prev) => prev + 1000), 1000)
        }

        function stop() {
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
            }
        }

        function handleVisibilityChange() {
            if (document.hidden) stop()
            else start()
        }

        start()
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            stop()
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [isHydrated, hasCompleted, currentExercise])

    /**
     * Navigation libre : l'apprenant peut choisir n'importe quel exercice
     * non soumis, dans n'importe quel ordre. Un exercice déjà terminé
     * rouvre directement son panneau de correction en mode lecture.
     */
    function goToExercise(index: number) {
        if (index < 0 || index >= exercises.length) return
        setCurrentIndex(index)
        setPanelOpen(isLocked(exercises[index].id))
    }

    function goToNext() {
        goToExercise(currentIndex + 1)
    }

    /**
     * Un 2e échec finalise automatiquement l'exercice — même traitement
     * qu'un "Voir la réponse" volontaire (réponse + explication affichées,
     * score à 0,25) — pour ne jamais laisser un réessai infini. Le bouton
     * "Voir la réponse" reste disponible dès le 1er échec pour qui veut
     * abandonner plus tôt (voir revealAnswer).
     */
    async function submitAnswer(answer: ExerciseAnswer) {
        if (!currentExercise || isLocked(currentExercise.id)) return

        // C'est le SERVEUR qui corrige. Le navigateur n'a plus les solutions —
        // le catalogue ne les envoie plus — et n'applique plus aucune règle :
        // ni la comparaison, ni les deux essais, ni le barème, ni la
        // finalisation immédiate de la vidéo interactive. Tout cela vit dans
        // ApprentissageService, une seule fois, pour tous les clients.
        const verdict = await corrigerExercice(currentExercise.id, answer)

        // Refus du serveur (exercice hors de portée, déjà terminé) : on ne
        // finalise rien et on ne compte pas d'essai. L'apprenant réessaiera.
        if (!verdict.succes) {
            setErreurCorrection(verdict.erreur ?? "La réponse n'a pas pu être envoyée.")
            return
        }

        setErreurCorrection(null)

        setAttempts((prev) => ({
            ...prev,
            [currentExercise.id]: {
                attemptsCount: verdict.nombreTentatives,
                lastAnswer: answer,
                lastAnswerCorrect: verdict.estCorrect,
                result: verdict.resultat === "success" || verdict.resultat === "revealed"
                    ? verdict.resultat
                    : null,
                score: verdict.resultat === null ? null : verdict.score,
                bonneReponse: avecDiscriminant(verdict.bonneReponse, currentExercise.type),
                feedbackCorrection: verdict.feedbackCorrection,
            },
        }))

        clearDraft(currentExercise.id)
        setPanelOpen(true)
    }

    /** Efface la dernière réponse pour permettre une nouvelle tentative — l'essai reste compté. */
    function retry() {
        if (!currentExercise) return
        setAttempts((prev) => ({
            ...prev,
            [currentExercise.id]: {
                ...(prev[currentExercise.id] ?? EMPTY_ATTEMPT),
                lastAnswer: null,
                lastAnswerCorrect: null,
            },
        }))
        clearDraft(currentExercise.id)
        setPanelOpen(false)
    }

    /**
     * Disponible dès le 1er échec — donne 0, pas le score partiel :
     * consulter la réponse au lieu de réessayer, c'est renoncer au 2e
     * essai plutôt que de le tenter réellement. Le partiel (voir
     * submitAnswer) récompense un effort réel, pas l'abandon.
     */
    async function revealAnswer() {
        if (!currentExercise) return

        // Même chemin que submitAnswer : c'est le serveur qui finalise et qui
        // rend la solution. Le navigateur ne la connaît pas.
        const verdict = await corrigerExercice(currentExercise.id, null, true)

        if (!verdict.succes) {
            setErreurCorrection(verdict.erreur ?? "La réponse n'a pas pu être révélée.")
            return
        }

        setErreurCorrection(null)

        setAttempts((prev) => ({
            ...prev,
            [currentExercise.id]: {
                ...(prev[currentExercise.id] ?? EMPTY_ATTEMPT),
                result: "revealed",
                score: verdict.score,
                bonneReponse: avecDiscriminant(verdict.bonneReponse, currentExercise.type),
                feedbackCorrection: verdict.feedbackCorrection,
            },
        }))

        clearDraft(currentExercise.id)
    }

    /**
     * "en-cours" capture soit une tentative posée sans résultat final, soit
     * un simple brouillon jamais soumis — distinct de "a-faire" (jamais
     * touché du tout).
     */
    function getStepperStatus(exercise: Exercise): StepperStatus {
        const attempt = getAttempt(exercise.id)
        if (attempt.result === "success") return "reussi"
        if (attempt.result === "revealed") return "echoue"
        if (attempt.attemptsCount > 0) return "en-cours"
        if (drafts[exercise.id] !== undefined) return "en-cours"
        return "a-faire"
    }

    const totalScore = useMemo(
        () => Object.values(attempts).reduce((sum, attempt) => sum + (attempt.score ?? 0), 0),
        [attempts]
    )

    /**
     * Repart à zéro sur une nouvelle tentative du niveau, sans jamais
     * perdre le résultat de la précédente : le score de cette tentative
     * (= totalScore au moment de l'appel, donc le niveau doit être complété)
     * rejoint `attemptsLog` (plafonné à MAX_ATTEMPTS_LOG, la plus ancienne
     * effacée en premier) et met à jour `bestScore` par max — jamais de
     * régression du score affiché à l'apprenant, peu importe combien de
     * tentatives ont eu lieu depuis. L'avertissement avant relance est un
     * choix d'UI à faire par l'appelant (page Bilan) avant d'invoquer cette
     * fonction — restart() lui-même ne demande pas de confirmation.
     *
     * elapsedMs au moment de l'appel = temps passé sur la tentative qui se
     * termine (il a été remis à zéro au restart précédent) — utilisé
     * directement comme timeSpentMs de l'entrée journalisée, avant d'être
     * lui-même remis à zéro pour la nouvelle tentative qui commence.
     *
     * logNiveauAttempt (apprenantNiveauAttempts.actions.ts) envoie la même
     * information au serveur, en plus de la copie locale ci-dessous — sert
     * le dossier apprenant (épopée 17) consulté par un formateur/
     * gestionnaire, qui n'a jamais accès au localStorage de quelqu'un
     * d'autre. Fire-and-forget (pas attendu) : ne bloque jamais le
     * redémarrage local, qui reste la priorité immédiate pour l'apprenant.
     */
    function restart() {
        const finishedScore = totalScore
        const finishedTimeSpentMs = elapsedMs
        const nextAttemptNumber = totalAttemptsCount + 1

        if (moduleId !== "unknown" && niveauId !== "unknown") {
            getCurrentSession().then(({ user }) => {
                logNiveauAttempt({
                    userId: user.id,
                    moduleId,
                    niveauId,
                    attemptNumber: nextAttemptNumber,
                    score: finishedScore,
                    maxScore: exercises.length,
                    timeSpentMs: finishedTimeSpentMs,
                })
            })
        }

        setAttemptsLog((prev) => {
            const entry: NiveauAttemptLogEntry = {
                attemptNumber: nextAttemptNumber,
                score: finishedScore,
                timeSpentMs: finishedTimeSpentMs,
                completedAt: new Date().toISOString(),
            }
            const next = [...prev, entry]
            return next.length > MAX_ATTEMPTS_LOG ? next.slice(next.length - MAX_ATTEMPTS_LOG) : next
        })
        setTotalAttemptsCount(nextAttemptNumber)
        setBestScore((prev) => (prev === null ? finishedScore : Math.max(prev, finishedScore)))
        setAttempts({})
        setDrafts({})
        setCurrentIndex(0)
        setElapsedMs(0)
        setPanelOpen(false)
    }

   return {
        currentExercise,
        currentIndex,
        currentAttempt,
        isCurrentLocked,
        isPanelOpen,
        setPanelOpen,
        goToExercise,
        goToNext,
        submitAnswer,
        retry,
        revealAnswer,
        getStepperStatus,
        getAttempt, 
        getDraft,
        setDraft,
        totalScore,
        hasCompleted,
        bestScore,
        attemptsLog,
        elapsedMs,
        totalAttemptsCount,
        restart,
        /** Non nul quand le serveur a refusé la dernière correction. */
        erreurCorrection,
    }
}