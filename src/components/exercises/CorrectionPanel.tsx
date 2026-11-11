"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark, faLightbulb, faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import type { Exercise } from "@/types/exercise"
import type { ExerciseAttemptState } from "@/hooks/useNiveauProgress"
import Button from "@/components/ui/Button"
import AudioButton from "@/components/ui/AudioButton"
import { getFeedbackCopy, formatAnswerForDisplay, formatCorrectAnswer } from "@/lib/exerciseFeedback"
import styles from "./CorrectionPanel.module.css"

interface CorrectionPanelProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    exercise: Exercise
    attempt: ExerciseAttemptState
    positionLabel: string
    onRetry: () => void
    onReveal: () => void
    onNext: () => void
    hasNext: boolean
    bilanHref: string
}

/**
 * Panneau persistant : reste dans le DOM une fois qu'une première tentative
 * a eu lieu (pas de `{isOpen && ...}` comme Drawer) — seul un déplacement en
 * CSS (transform) le réduit ou l'ouvre, pour ne jamais perdre son contenu ni
 * son état. Voir "Correction et feedback" dans EXERCISE_TYPES.md.
 */
export default function CorrectionPanel({
    isOpen,
    onOpenChange,
    exercise,
    attempt,
    positionLabel,
    onRetry,
    onReveal,
    onNext,
    hasNext,
    bilanHref,
}: CorrectionPanelProps) {
    const hasContent = attempt.attemptsCount > 0 || attempt.result !== null
    if (!hasContent) return null

    const isFinal = attempt.result !== null
    const isSuccess = attempt.result === "success"
    const isRevealed = attempt.result === "revealed"
    // Dès le 1er échec, l'apprenant peut choisir d'abandonner et voir la
    // réponse tout de suite — un 2e échec la révèle automatiquement de
    // toute façon (voir useNiveauProgress.submitAnswer), donc ce bouton ne
    // s'affiche jamais que pendant cette fenêtre d'un seul échec.
    const canOfferReveal = !isFinal && attempt.attemptsCount >= 1

    // video_interactive : pas d'indice possible (pas de "bonne réponse"
    // unique à deviner), et "Votre réponse" affiche Réussi/Échoué plutôt
    // que le fichier vidéo de la fin atteinte — non pertinent pour
    // l'apprenant.
    const isVideoInteractive = exercise.type === "video_interactive"

    // Bonne réponse et explication viennent maintenant du SERVEUR, rendues à
    // la finalisation par POST …/exercices/cle/{key}/repondre. Le catalogue ne
    // les porte plus : les lire dans l'exercice donnerait « — » et rien
    // d'autre. Repli sur exercise.explanation pour l'aperçu formateur, qui
    // travaille sur le contenu complet et ne passe pas par la correction.
    const explication = attempt.feedbackCorrection ?? exercise.explanation

    const copy = getFeedbackCopy({
        isSuccess,
        isRevealed,
        attemptsCount: attempt.attemptsCount,
    })

    /**
     * Ce que le haut-parleur prononce, dans l'ordre de l'écran : le verdict,
     * puis la réponse attendue, puis l'explication — ou l'indice tant que
     * l'exercice n'est pas terminé. Les conditions sont celles de l'affichage,
     * pour ne jamais lire ce qui n'est pas montré.
     *
     * Le sous-titre (« Réussi après un nouvel essai ») est écarté : c'est un
     * état, pas du contenu. L'entendre avant la réponse retarde ce que la
     * personne attend, et c'est elle qui en a le plus besoin.
     */
    const segmentsLecture = [
        copy.title,
        isFinal && !isVideoInteractive
            ? `La réponse attendue était : ${formatCorrectAnswer(exercise, attempt.bonneReponse)}`
            : null,
        isFinal && explication ? `Explication : ${explication}` : null,
        !isFinal && exercise.hint && !isVideoInteractive ? `Indice : ${exercise.hint}` : null,
    ].filter((segment): segment is string => Boolean(segment))

    // La ponctuation finale de chaque segment est retirée avant l'assemblage,
    // sinon la lecture donnerait « Bonne réponse !. La réponse attendue… ».
    const lectureVocale = segmentsLecture
        .map((segment) => segment.replace(/[.,!?\s]+$/, ""))
        .join(". ")

    return (
        <div
            className={`${styles.panel} ${isOpen ? styles.open : styles.collapsed}`}
            role="region"
            aria-label="Correction"
        >
            <button
                type="button"
                className={styles.grabber}
                onClick={() => onOpenChange(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className={styles.grabberHandle} aria-hidden="true" />
                <span className={styles.grabberLabel}>{isOpen ? "Réduire" : copy.title}</span>
            </button>

            <div className={styles.body}>
                <div className={styles.header}>
                    <div>
                        <p className={styles.title}>{copy.title}</p>
                        {copy.subtitle && <p className={styles.subtitle}>{copy.subtitle}</p>}
                    </div>
                    <div className={styles.headerActions}>
                        <AudioButton text={lectureVocale} />
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={() => onOpenChange(false)}
                            aria-label="Fermer"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>

                {(!isSuccess || isVideoInteractive) && attempt.lastAnswer && (
                    <p className={styles.field}>
                        <span className={styles.fieldLabel}>Votre réponse</span>
                        {isVideoInteractive
                            ? isSuccess
                                ? "Réussi"
                                : "Échoué"
                            : formatAnswerForDisplay(exercise, attempt.lastAnswer)}
                    </p>
                )}

                {isFinal && !isVideoInteractive && (
                    <p className={styles.field}>
                        <span className={styles.fieldLabel}>Bonne réponse</span>
                        {formatCorrectAnswer(exercise, attempt.bonneReponse)}
                    </p>
                )}

                {isFinal && explication && (
                    <p
                        className={`${styles.explanation} ${
                            isSuccess ? styles.explanationSuccess : styles.explanationError
                        }`}
                    >
                        <FontAwesomeIcon icon={isSuccess ? faCircleCheck : faCircleXmark} aria-hidden="true" />
                        <span>
                            <span className={styles.calloutLabel}>Explication</span>
                            {explication}
                        </span>
                    </p>
                )}

                {!isFinal && exercise.hint && !isVideoInteractive && (
                    <p className={styles.hint}>
                        <FontAwesomeIcon icon={faLightbulb} aria-hidden="true" />
                        <span>
                            <span className={styles.calloutLabel}>Indice</span>
                            {exercise.hint}
                        </span>
                    </p>
                )}

                <div className={styles.footer}>
                    <span className={styles.position}>{positionLabel}</span>
                    <div className={styles.actions}>
                        {!isFinal && <Button label="Réessayer" variant="outline" onClick={onRetry} />}
                        {canOfferReveal && <Button label="Voir la réponse" variant="ghost" onClick={onReveal} />}
                        {isFinal && hasNext && (
                            <Button label="Exercice suivant →" variant="primary" onClick={onNext} />
                        )}
                        {isFinal && !hasNext && (
                            <Button label="Voir le résultat →" variant="primary" href={bilanHref} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}