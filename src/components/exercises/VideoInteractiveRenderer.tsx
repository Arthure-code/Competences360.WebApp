"use client"

import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay } from "@fortawesome/free-solid-svg-icons"
import type { VideoInteractiveExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import ResultIcon from "./dnd/ResultIcon"
import Button from "@/components/ui/Button"
import styles from "./VideoInteractiveRenderer.module.css"

interface PathStep {
    nodeId: string
    decisionPointIndex: number
    choiceId: string
}

/**
 * Chaque choix a une correction (isCorrect) — pas un parcours purement
 * exploratoire. Réussi seulement si CHAQUE choix emprunté était correct
 * (voir lib/exercise-validation.ts). Le chemin complet est suivi (`path`),
 * pas juste la fin atteinte, pour pouvoir valider rétroactivement.
 *
 * Pas de <video controls> natif — permettrait de scruber au-delà d'un
 * point de décision et de casser le mécanisme. Un bouton "Commencer"
 * explicite déclenche la 1ère lecture (contournement des politiques de
 * lecture automatique des navigateurs) ; les segments suivants
 * s'enchaînent automatiquement depuis le clic sur un choix, qui compte
 * déjà comme un geste utilisateur.
 *
 * Les accès à `node.video` sont défensifs (`?.`) : un contenu à l'ancien
 * format ne porte pas de vidéo par nœud, et sans cette garde le renderer
 * lève sur `.url` et fait tomber toute la page dans l'ErrorBoundary.
 *
 * Une fois répondu, on n'affiche PAS de vidéo rejouable — elle donnait
 * l'impression que l'exercice recommençait. On montre le récapitulatif des
 * choix pris, chacun marqué ✓ ou ✗ par comparaison au chemin solution.
 */
export default function VideoInteractiveRenderer({
    exercise,
    lastAnswer,
    solution,
    onSubmit,
}: ExerciseRendererProps<VideoInteractiveExercise>) {
    const submittedEndNodeId = lastAnswer?.type === "video_interactive" ? lastAnswer.endNodeId : null
    const isAnswered = submittedEndNodeId !== null

    const [currentNodeId, setCurrentNodeId] = useState(exercise.config.startNodeId)
    const [path, setPath] = useState<PathStep[]>([])
    const [hasStarted, setHasStarted] = useState(false)
    const [visibleDecisionIndex, setVisibleDecisionIndex] = useState<number | null>(null)
    const [hasEnded, setHasEnded] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const triggeredRef = useRef<Set<number>>(new Set())

    // Réinitialise l'état local (chemin, position dans le graphe) quand
    // lastAnswer redevient null — couvre le réessai (useNiveauProgress.retry
    // efface lastAnswer mais ce composant ne démonte pas entre-temps, donc
    // sans ce reset le chemin d'une tentative précédente resterait affiché).
    useEffect(() => {
        if (lastAnswer === null) {
            setCurrentNodeId(exercise.config.startNodeId)
            setPath([])
            setHasStarted(false)
            setHasEnded(false)
            setVisibleDecisionIndex(null)
            triggeredRef.current = new Set()
        }
    }, [lastAnswer])

    const nodesById = Object.fromEntries(exercise.config.nodes.map((node) => [node.id, node]))

    if (isAnswered) {
        const parcours = lastAnswer?.type === "video_interactive" ? lastAnswer.path : []
        const cheminSolution = solution?.type === "video_interactive" ? solution.path : []

        // Le choix pris était-il le bon ? La config apprenant ne porte plus
        // `isCorrect` : on compare au chemin solution rendu par le serveur.
        // Rend null si la solution ne couvre pas cette étape (rien n'est alors
        // marqué plutôt que d'inventer un verdict).
        const etaitCorrect = (step: PathStep): boolean | null => {
            const attendu = cheminSolution.find(
                (s) => s.nodeId === step.nodeId && s.decisionPointIndex === step.decisionPointIndex
            )
            return attendu ? attendu.choiceId === step.choiceId : null
        }

        const libelleDuChoix = (step: PathStep): string => {
            const choix = nodesById[step.nodeId]?.decisionPoints[step.decisionPointIndex]?.choices.find(
                (c) => c.id === step.choiceId
            )
            return choix?.label ?? "Choix"
        }

        return (
            <div className={styles.wrapper}>
                <ExerciseQuestionHeader exercise={exercise} />
                <div className={styles.recap}>
                    {parcours.length === 0 ? (
                        <p className={styles.completedLabel}>Vous avez terminé ce parcours.</p>
                    ) : (
                        <>
                            <p className={styles.recapTitle}>Vos choix</p>
                            <ol className={styles.recapList}>
                                {parcours.map((step) => {
                                    const correct = etaitCorrect(step)
                                    return (
                                        <li
                                            key={`${step.nodeId}-${step.decisionPointIndex}`}
                                            className={styles.recapItem}
                                        >
                                            <ResultIcon
                                                isCorrect={correct}
                                                className={correct ? styles.iconCorrect : styles.iconIncorrect}
                                            />
                                            <span>{libelleDuChoix(step)}</span>
                                        </li>
                                    )
                                })}
                            </ol>
                        </>
                    )}
                </div>
            </div>
        )
    }

    const currentNode = nodesById[currentNodeId]
    const isEndNode = !currentNode || currentNode.decisionPoints.length === 0

    function handleStart() {
        setHasStarted(true)
        // play() rend une promesse, rejetée si la vidéo quitte le DOM avant le
        // démarrage (changement d'exercice, navigation). Sans ce catch, le rejet
        // remonte en unhandledRejection dans la console.
        videoRef.current?.play()?.catch(() => {})
    }

    function handleTimeUpdate() {
        if (!currentNode || visibleDecisionIndex !== null) return
        const video = videoRef.current
        if (!video) return

        const index = currentNode.decisionPoints.findIndex(
            (point, i) => !triggeredRef.current.has(i) && video.currentTime >= point.timestampSeconds
        )
        if (index !== -1) {
            triggeredRef.current.add(index)
            video.pause()
            setVisibleDecisionIndex(index)
        }
    }

    function handleChoice(choiceId: string, nextNodeId: string) {
        if (!currentNode || visibleDecisionIndex === null) return

        setPath((prev) => [
            ...prev,
            { nodeId: currentNode.id, decisionPointIndex: visibleDecisionIndex, choiceId },
        ])

        triggeredRef.current = new Set()
        setVisibleDecisionIndex(null)
        setHasEnded(false)
        setCurrentNodeId(nextNodeId)
        // Le clic est déjà un geste utilisateur, .play() ici passe les
        // politiques de lecture automatique sans avoir besoin de `muted`.
        requestAnimationFrame(() => videoRef.current?.play()?.catch(() => {}))
    }

    function handleVideoEnded() {
        if (isEndNode) setHasEnded(true)
    }

    function handleFinish() {
        onSubmit({ type: "video_interactive", endNodeId: currentNodeId, path })
    }

    const activeDecision =
        visibleDecisionIndex !== null ? currentNode?.decisionPoints[visibleDecisionIndex] : undefined

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.videoWrapper}>
                {currentNode && (
                    <video
                        key={currentNode.id}
                        ref={videoRef}
                        src={currentNode.video?.url}
                        className={styles.video}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        aria-label={currentNode.video?.alt ?? ""}
                    />
                )}

                {!hasStarted && (
                    <button type="button" className={styles.playOverlay} onClick={handleStart} aria-label="Commencer la vidéo">
                        <span className={styles.playButton}>
                            <FontAwesomeIcon icon={faPlay} aria-hidden="true" />
                        </span>
                    </button>
                )}

                {activeDecision && (
                    <div className={styles.decisionOverlay}>
                        {activeDecision.choices.map((choice) => (
                            <button
                                key={choice.id}
                                type="button"
                                className={styles.choiceButton}
                                onClick={() => handleChoice(choice.id, choice.nextNodeId)}
                            >
                                {choice.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isEndNode && hasEnded && (
                <div className={styles.actionRow}>
                    <Button label="Terminer ce parcours" variant="secondary" size="lg" onClick={handleFinish} />
                </div>
            )}
        </div>
    )
}
