"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons"
import type { QuestionNumeriqueExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import styles from "./QuestionNumeriqueRenderer.module.css"

type FieldState = "default" | "correct" | "incorrect"

/**
 * Parse une saisie numérique en acceptant les formats FR courants :
 * virgule comme séparateur décimal, espace (normal ou insécable) comme
 * séparateur de milliers. Retourne `null` si la saisie n'est pas un
 * nombre valide ou non ambiguë — ex. "1,234,56" (deux virgules) est
 * rejeté plutôt que mal interprété, "1 234,56" est accepté.
 */
function parseNumericInput(raw: string): number | null {
    const cleaned = raw
        .trim()
        .replace(/[\s\u00A0]/g, "") // espaces (séparateur de milliers FR)
        .replace(",", ".") // première virgule décimale FR -> point

    if (cleaned === "" || cleaned === "-" || cleaned === ".") return null
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null

    const value = Number(cleaned)
    return Number.isFinite(value) ? value : null
}

/**
 * Nombre de décimales à afficher, dérivé de la tolérance déclarée par
 * l'exercice — évite d'afficher un artefact de précision flottante
 * (ex. 0.30000000000000004) ou un excès de décimales sans rapport avec la
 * précision réellement attendue.
 */
function decimalPlacesFromTolerance(tolerance: number): number {
    if (tolerance <= 0) return 2
    const decimalPart = tolerance.toString().split(".")[1]
    return decimalPart ? decimalPart.length : 0
}

/**
 * Se distingue de "réponse courte" par : un pavé +/- pour ajuster sans
 * clavier (incrément calé sur la tolérance, avec un plancher pour éviter
 * un stepper inutilisable sur une tolérance très fine — voir `step`
 * ci-dessous), et la tolérance acceptée affichée en filigrane pour que la
 * correction ne semble jamais arbitraire.
 */
export default function QuestionNumeriqueRenderer({
    exercise,
    lastAnswer,
    draft,
    onDraftChange,
    onSubmit,
    solution,
}: ExerciseRendererProps<QuestionNumeriqueExercise>) {
    const submittedValue = lastAnswer?.type === "question_numerique" ? lastAnswer.value : null
    const draftText = (draft as string | undefined) ?? ""

    const isAnswered = submittedValue !== null

    // La valeur attendue vient du SERVEUR (`bonneReponse`), plus de la config.
    // La tolérance, elle, y reste : elle est annoncée à l'apprenant avant
    // qu'il réponde (« ± 2 »), elle ne révèle donc rien.
    const isCorrect =
        isAnswered
        && solution?.type === "question_numerique"
        && Math.abs(submittedValue - solution.value) <= exercise.config.tolerance

    // Tant que le serveur n'a pas tranché, on n'affiche aucun verdict —
    // colorer en rouge une réponse non encore corrigée serait un mensonge.
    let state: FieldState = "default"
    if (isAnswered && solution) state = isCorrect ? "correct" : "incorrect"

    const parsedDraft = parseNumericInput(draftText)
    const hasInvalidInput = draftText.trim() !== "" && parsedDraft === null

    // Incrément proportionnel à la tolérance, avec un plancher à 0,1 :
    // sur une tolérance très fine (ex. ±0,01), avancer strictement au pas
    // de la tolérance rendrait le stepper quasi inutilisable (100 clics
    // pour avancer de 1). Le plancher garde le geste utile même si le pas
    // ne colle plus exactement à la tolérance dans ce cas.
    const step = Math.max(exercise.config.tolerance > 0 ? exercise.config.tolerance : 1, 0.1)

    function nudge(direction: 1 | -1) {
        const current = parseNumericInput(draftText) ?? 0
        const next = Math.round((current + direction * step) * 100) / 100
        onDraftChange(String(next))
    }

    function handleSubmit() {
        if (parsedDraft === null) return
        onSubmit({ type: "question_numerique", value: parsedDraft })
    }

    const decimals = decimalPlacesFromTolerance(exercise.config.tolerance)
    const displayValue = isAnswered ? submittedValue.toFixed(decimals) : draftText

    return (
        <div className={styles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={styles.fieldRow}>
                {!isAnswered && (
                    <button
                        type="button"
                        className={styles.stepperButton}
                        onClick={() => nudge(-1)}
                        aria-label="Diminuer la valeur"
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button>
                )}

                <input
                    type="text"
                    inputMode="decimal"
                    className={`${styles.field} ${styles[state]}`}
                    value={displayValue}
                    disabled={isAnswered}
                    onChange={(e) => onDraftChange(e.target.value)}
                    aria-label="Votre réponse"
                    aria-invalid={hasInvalidInput}
                    autoComplete="off"
                />
                {exercise.config.unit && <span className={styles.unit}>{exercise.config.unit}</span>}

                {!isAnswered && (
                    <button
                        type="button"
                        className={styles.stepperButton}
                        onClick={() => nudge(1)}
                        aria-label="Augmenter la valeur"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                )}
            </div>

            {!isAnswered && hasInvalidInput && (
                <p className={styles.errorHint}>Entrez un nombre valide, ex. 12,5</p>
            )}

            {!isAnswered && !hasInvalidInput && exercise.config.tolerance > 0 && (
                <p className={styles.toleranceHint}>
                    Réponse acceptée à ± {exercise.config.tolerance}
                    {exercise.config.unit ? ` ${exercise.config.unit}` : ""} près
                </p>
            )}

            {!isAnswered && (
                <div className={styles.actionRow}>
                    <Button
                        label="Valider ma réponse"
                        variant="secondary"
                        size="lg"
                        disabled={parsedDraft === null}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}