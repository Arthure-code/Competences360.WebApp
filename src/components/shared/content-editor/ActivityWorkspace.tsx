"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronUp, faChevronDown, faXmark, faPlus } from "@fortawesome/free-solid-svg-icons"
import PageSubheader from "@/components/ui/PageSubheader"
import Button from "@/components/ui/Button"
import ExercisePreviewToggle from "./exercise-preview/ExercisePreviewToggle"
import QcmEditablePreview from "./exercise-preview/QcmEditablePreview"
import VraiFauxEditablePreview from "./exercise-preview/VraiFauxEditablePreview"
import QuestionNumeriqueEditablePreview from "./exercise-preview/QuestionNumeriqueEditablePreview"
import ReponseCourteEditablePreview from "./exercise-preview/ReponseCourteEditablePreview"
import OrdreEditablePreview from "./exercise-preview/OrdreEditablePreview"
import AssociationEditablePreview from "./exercise-preview/AssociationEditablePreview"
import ZoneCliquableEditablePreview from "./exercise-preview/ZoneCliquableEditablePreview"
import ZoneRemplirEditablePreview from "./exercise-preview/ZoneRemplirEditablePreview"
import VideoInteractiveEditablePreview from "./exercise-preview/VideoInteractiveEditablePreview"
import TestModeRenderer from "./exercise-preview/TestModeRenderer"
import ExerciseHintExplanationEditor from "./exercise-preview/ExerciseHintExplanationEditor"
import CommentThread from "./review/CommentThread"
import CommentBadge from "./review/CommentBadge"
import { createExercise, changeExerciseType } from "@/lib/exerciseDrafts"
import { EXERCISE_TAG_LABELS } from "@/lib/exerciseLabels"
import { CONTENT_TEXT_LIMITS, MAX_PRACTICE_ITEMS } from "@/constants/contentLimits"
import type { NiveauDraft } from "@/types/moduleVersion"
import type { Exercise, ExerciseKind } from "@/types/exercise"
import type { ReviewComment } from "@/types/reviewComment"
import styles from "./ActivityWorkspace.module.css"

interface ActivityWorkspaceProps {
    niveau: NiveauDraft
    onChange: (patch: Partial<NiveauDraft>) => void
    versionId: string
    comments: ReviewComment[]
    currentUserId: string
    currentUserName: string
    canComment: boolean
    /**
     * Cache toute l'édition (champs, ajouter/retirer/réordonner exercices,
     * changer de type, indice/explication), mais jamais la sélection ni
     * le mode test, qui doit rester pleinement interactif : c'est
     * justement le but de l'aperçu (voir ContentEditor.tsx, PreviewEditorView.tsx).
     */
    readOnly?: boolean
}

const DIFFICULTY_OPTIONS = [
    { value: "novice", label: "Novice" },
    { value: "intermediaire", label: "Intermédiaire" },
    { value: "expert", label: "Expert" },
] as const

const EXERCISE_TYPE_OPTIONS: ExerciseKind[] = [
    "qcm",
    "vrai_faux",
    "reponse_courte",
    "question_numerique",
    "ordre",
    "association",
    "zone_cliquable",
    "zone_remplir",
    "video_interactive",
]

/**
 * Panneau gauche (infos de l'activité + liste des exercices) + panneau
 * droit (aperçu interactif de l'exercice sélectionné, Modifier/Tester) —
 * remplace l'ancien NiveauPanel/ExerciseRow (formulaires classiques).
 */
export default function ActivityWorkspace({
    niveau,
    onChange,
    versionId,
    comments,
    currentUserId,
    currentUserName,
    canComment,
    readOnly = false,
}: ActivityWorkspaceProps) {
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(niveau.exercises[0]?.id ?? null)
    const [mode, setMode] = useState<"edit" | "test">(readOnly ? "test" : "edit")

    const selectedExercise = niveau.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null

    const niveauComments = comments.filter((c) => c.target === "niveau" && c.targetId === niveau.id)
    const selectedExerciseComments = selectedExercise
        ? comments.filter((c) => c.target === "exercise" && c.targetId === selectedExercise.id)
        : []

    function exerciseCommentCount(exerciseId: string) {
        const matching = comments.filter((c) => c.target === "exercise" && c.targetId === exerciseId)
        return { total: matching.length, unresolved: matching.filter((c) => !c.resolved).length }
    }

    function addExercise() {
        const newExercise = createExercise({
            id: crypto.randomUUID(),
            niveauId: niveau.id,
            slug: `exercice-${niveau.exercises.length + 1}`,
            index: niveau.exercises.length + 1,
            type: "qcm",
        })
        onChange({ exercises: [...niveau.exercises, newExercise] })
        setSelectedExerciseId(newExercise.id)
        setMode("edit")
    }

    function updateExercise(exerciseId: string, patch: Partial<Exercise>) {
        onChange({
            exercises: niveau.exercises.map((exercise) =>
                exercise.id === exerciseId ? ({ ...exercise, ...patch } as Exercise) : exercise
            ),
        })
    }

    function updateExerciseType(exerciseId: string, newType: ExerciseKind) {
        onChange({
            exercises: niveau.exercises.map((exercise) =>
                exercise.id === exerciseId ? changeExerciseType(exercise, newType) : exercise
            ),
        })
        setMode("edit")
    }

    function removeExercise(exerciseId: string) {
        const next = niveau.exercises.filter((exercise) => exercise.id !== exerciseId)
        onChange({ exercises: next })
        if (selectedExerciseId === exerciseId) setSelectedExerciseId(next[0]?.id ?? null)
    }

    function moveExercise(exerciseId: string, direction: -1 | 1) {
        const index = niveau.exercises.findIndex((exercise) => exercise.id === exerciseId)
        const newIndex = index + direction
        if (newIndex < 0 || newIndex >= niveau.exercises.length) return
        const next = [...niveau.exercises]
        ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
        onChange({ exercises: next })
    }

    function updatePracticeItem(index: number, value: string) {
        const next = [...niveau.practiceItems]
        next[index] = value
        onChange({ practiceItems: next })
    }

    function addPracticeItem() {
        onChange({ practiceItems: [...niveau.practiceItems, ""] })
    }

    function removePracticeItem(index: number) {
        onChange({ practiceItems: niveau.practiceItems.filter((_, i) => i !== index) })
    }

    return (
        <div className={styles.workspace}>
            <div className={styles.leftPanel}>
                <label className={styles.field}>
                    <span className={styles.label}>Titre</span>
                    <input
                        type="text"
                        value={niveau.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        className={styles.input}
                        disabled={readOnly}
                    />
                </label>

                {(canComment || niveauComments.length > 0) && (
                    <div className={styles.field}>
                        <span className={styles.label}>Commentaires de révision</span>
                        <CommentThread
                            comments={niveauComments}
                            versionId={versionId}
                            target="niveau"
                            targetId={niveau.id}
                            currentUserId={currentUserId}
                            currentUserName={currentUserName}
                            canCreate={canComment}
                        />
                    </div>
                )}

                <div className={styles.field}>
                    <span className={styles.label}>Description</span>
                    <textarea
                        value={niveau.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        className={styles.textarea}
                        rows={3}
                        maxLength={CONTENT_TEXT_LIMITS.activityDescription}
                        disabled={readOnly}
                    />
                    <span className={styles.charCount}>
                        {niveau.description.length}/{CONTENT_TEXT_LIMITS.activityDescription}
                    </span>
                </div>

                {!readOnly && (
                    <div className={styles.field}>
                        <span className={styles.label}>Ce que vous allez pratiquer</span>
                        <span className={styles.fieldHint}>Idéalement 3 à 4 éléments courts, affichés sous forme de liste à cocher</span>
                        <div className={styles.practiceItemsList}>
                            {niveau.practiceItems.map((item, index) => (
                                <div key={index} className={styles.practiceItemRow}>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updatePracticeItem(index, e.target.value)}
                                        className={styles.input}
                                        placeholder="Ex. Identifier un ton trop familier"
                                        maxLength={CONTENT_TEXT_LIMITS.practiceItemText}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePracticeItem(index)}
                                        aria-label="Retirer cet élément"
                                        className={styles.removePracticeItemButton}
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className={styles.addPracticeItemButton}
                            onClick={addPracticeItem}
                            disabled={niveau.practiceItems.length >= MAX_PRACTICE_ITEMS}
                        >
                            <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un élément (
                            {niveau.practiceItems.length}/{MAX_PRACTICE_ITEMS})
                        </button>
                    </div>
                )}

                <div className={styles.row}>
                    <label className={styles.field}>
                        <span className={styles.label}>Difficulté</span>
                        <select
                            value={niveau.difficulty}
                            onChange={(e) => onChange({ difficulty: e.target.value as NiveauDraft["difficulty"] })}
                            className={styles.select}
                            disabled={readOnly}
                        >
                            {DIFFICULTY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Durée (minutes)</span>
                        <input
                            type="number"
                            min={1}
                            value={niveau.durationMinutes}
                            onChange={(e) => onChange({ durationMinutes: Number(e.target.value) })}
                            className={styles.input}
                            disabled={readOnly}
                        />
                    </label>
                </div>

                <div className={styles.exercisesSection}>
                    <PageSubheader title="Exercices" count={niveau.exercises.length} />
                    <div className={styles.exerciseList}>
                        {niveau.exercises.map((exercise, index) => (
                            <div
                                key={exercise.id}
                                className={`${styles.exerciseListItem} ${
                                    selectedExerciseId === exercise.id ? styles.exerciseListItemActive : ""
                                }`}
                            >
                                <button
                                    type="button"
                                    className={styles.exerciseSelectButton}
                                    onClick={() => {
                                        setSelectedExerciseId(exercise.id)
                                        setMode(readOnly ? "test" : "edit")
                                    }}
                                >
                                    <span className={styles.exerciseIndex}>{index + 1}</span>
                                    <span className={styles.exerciseTypeLabel}>{EXERCISE_TAG_LABELS[exercise.type]}</span>
                                    <span className={styles.exercisePromptPreview}>{exercise.prompt || "Sans énoncé"}</span>
                                    <CommentBadge {...exerciseCommentCount(exercise.id)} />
                                </button>
                                {!readOnly && (
                                    <div className={styles.exerciseListActions}>
                                        <button
                                            type="button"
                                            onClick={() => moveExercise(exercise.id, -1)}
                                            disabled={index === 0}
                                            aria-label="Monter"
                                        >
                                            <FontAwesomeIcon icon={faChevronUp} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveExercise(exercise.id, 1)}
                                            disabled={index === niveau.exercises.length - 1}
                                            aria-label="Descendre"
                                        >
                                            <FontAwesomeIcon icon={faChevronDown} />
                                        </button>
                                        <button type="button" onClick={() => removeExercise(exercise.id)} aria-label="Retirer">
                                            <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {!readOnly && <Button label="+ Ajouter un exercice" variant="outline" onClick={addExercise} />}
                </div>
            </div>

            <div className={styles.rightPanel}>
                {selectedExercise ? (
                    <>
                        <div className={styles.previewHeader}>
                            {!readOnly && (
                                <select
                                    value={selectedExercise.type}
                                    onChange={(e) => updateExerciseType(selectedExercise.id, e.target.value as ExerciseKind)}
                                    className={styles.typeSelect}
                                >
                                    {EXERCISE_TYPE_OPTIONS.map((type) => (
                                        <option key={type} value={type}>
                                            {EXERCISE_TAG_LABELS[type]}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!readOnly && <ExercisePreviewToggle mode={mode} onChange={setMode} />}
                        </div>

                        <div className={styles.previewArea}>
                            {readOnly || mode === "test" ? (
                                <TestModeRenderer exercise={selectedExercise} />
                            ) : selectedExercise.type === "qcm" ? (
                                <QcmEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "vrai_faux" ? (
                                <VraiFauxEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "question_numerique" ? (
                                <QuestionNumeriqueEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "reponse_courte" ? (
                                <ReponseCourteEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "ordre" ? (
                                <OrdreEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "association" ? (
                                <AssociationEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "zone_cliquable" ? (
                                <ZoneCliquableEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : selectedExercise.type === "zone_remplir" ? (
                                <ZoneRemplirEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            ) : (
                                <VideoInteractiveEditablePreview
                                    exercise={selectedExercise}
                                    onConfigChange={(config) => updateExercise(selectedExercise.id, { config })}
                                    onPromptChange={(prompt) => updateExercise(selectedExercise.id, { prompt })}
                                />
                            )}
                        </div>

                        {!readOnly && mode === "edit" && (
                            <ExerciseHintExplanationEditor
                                hint={selectedExercise.hint}
                                explanation={selectedExercise.explanation}
                                onHintChange={(hint) => updateExercise(selectedExercise.id, { hint })}
                                onExplanationChange={(explanation) =>
                                    updateExercise(selectedExercise.id, { explanation })
                                }
                            />
                        )}

                        {(canComment || selectedExerciseComments.length > 0) && (
                            <div className={styles.exerciseCommentsSection}>
                                <span className={styles.label}>Commentaires de révision</span>
                                <CommentThread
                                    comments={selectedExerciseComments}
                                    versionId={versionId}
                                    target="exercise"
                                    targetId={selectedExercise.id}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    canCreate={canComment}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <p className={styles.emptyState}>Ajoutez un exercice pour commencer.</p>
                )}
            </div>
        </div>
    )
}