"use client"

import { useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faImage, faCheck } from "@fortawesome/free-solid-svg-icons"
import type { ZoneCliquableExercise } from "@/types/exercise"
import { zonesOverlap } from "@/lib/zoneOverlap"
import { CONTENT_TEXT_LIMITS, MAX_ZONES_CLIQUABLES } from "@/constants/contentLimits"
import FileUploader from "@/components/shared/FileUploader"
import zcStyles from "@/components/exercises/ZoneCliquableRenderer.module.css"
import styles from "./ZoneCliquableEditablePreview.module.css"

interface ZoneCliquableEditablePreviewProps {
    exercise: ZoneCliquableExercise
    onConfigChange: (config: ZoneCliquableExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

type DraftRect = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number }

/**
 * Clic-glisser (souris) ou glisser du doigt (tactile) directement sur
 * l'image pour dessiner une zone — comme les vrais outils du domaine
 * (Genially, H5P). Plusieurs zones peuvent être marquées "bonne réponse"
 * (ex. "cliquez sur n'importe quelle fenêtre"), un clic/tap sur une zone
 * bascule son statut. Anti-chevauchement via lib/zoneOverlap.ts, vérifié à
 * chaque nouvelle zone dessinée — refusée si elle chevauche une zone
 * existante, pas juste avertie après coup.
 */
export default function ZoneCliquableEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: ZoneCliquableEditablePreviewProps) {
    const imageRef = useRef<HTMLDivElement>(null)
    const [drawStart, setDrawStart] = useState<Point | null>(null)
    const [draftRect, setDraftRect] = useState<DraftRect | null>(null)
    const [overlapWarning, setOverlapWarning] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const hasImage = Boolean(exercise.config.image.url)

    function getRelativePosition(clientX: number, clientY: number): Point | null {
        if (!imageRef.current) return null
        const rect = imageRef.current.getBoundingClientRect()
        const x = ((clientX - rect.left) / rect.width) * 100
        const y = ((clientY - rect.top) / rect.height) * 100
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
    }

    function startDrawing(target: EventTarget, pos: Point | null) {
        if ((target as HTMLElement).closest?.(`.${zcStyles.zone}`)) return
        if (exercise.config.zones.length >= MAX_ZONES_CLIQUABLES) return
        if (!pos) return
        setDrawStart(pos)
        setDraftRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
        setOverlapWarning(false)
    }

    function updateDrawing(pos: Point | null) {
        if (!drawStart || !pos) return
        setDraftRect({
            x: Math.min(drawStart.x, pos.x),
            y: Math.min(drawStart.y, pos.y),
            width: Math.abs(pos.x - drawStart.x),
            height: Math.abs(pos.y - drawStart.y),
        })
    }

    function finishDrawing() {
        setDrawStart(null)
        if (!draftRect) return

        // Un simple tap/clic sans glisser ne crée pas de zone (trop petite pour être intentionnelle).
        if (draftRect.width < 2 || draftRect.height < 2) {
            setDraftRect(null)
            return
        }

        const overlapsExisting = exercise.config.zones.some((zone) => zonesOverlap(zone, draftRect))
        if (overlapsExisting) {
            setOverlapWarning(true)
            setDraftRect(null)
            return
        }

        onConfigChange({
            ...exercise.config,
            zones: [...exercise.config.zones, { id: crypto.randomUUID(), ...draftRect, isCorrect: false }],
        })
        setDraftRect(null)
    }

    // --- Souris ---
    function handleMouseDown(e: React.MouseEvent) {
        startDrawing(e.target, getRelativePosition(e.clientX, e.clientY))
    }
    function handleMouseMove(e: React.MouseEvent) {
        updateDrawing(getRelativePosition(e.clientX, e.clientY))
    }

    // --- Tactile ---
    function handleTouchStart(e: React.TouchEvent) {
        const touch = e.touches[0]
        if (!touch) return
        startDrawing(e.target, getRelativePosition(touch.clientX, touch.clientY))
    }
    function handleTouchMove(e: React.TouchEvent) {
        if (!drawStart) return
        e.preventDefault() // empêche le scroll de la page pendant le tracé
        const touch = e.touches[0]
        if (!touch) return
        updateDrawing(getRelativePosition(touch.clientX, touch.clientY))
    }

    function toggleCorrect(zoneId: string) {
        onConfigChange({
            ...exercise.config,
            zones: exercise.config.zones.map((zone) =>
                zone.id === zoneId ? { ...zone, isCorrect: !zone.isCorrect } : zone
            ),
        })
    }

    function removeZone(zoneId: string) {
        onConfigChange({ ...exercise.config, zones: exercise.config.zones.filter((zone) => zone.id !== zoneId) })
    }

    return (
        <div className={zcStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Zone cliquable</span>
                <textarea
                    value={exercise.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={styles.promptInput}
                    placeholder="Énoncé de la question"
                    rows={2}
                    maxLength={CONTENT_TEXT_LIMITS.exercisePrompt}
                />
            </div>

            {!hasImage ? (
                <FileUploader
                    kinds="image"
                    onUploadComplete={({ url, name }) => {
                        setUploadError(null)
                        onConfigChange({ ...exercise.config, image: { type: "image", url, alt: name } })
                    }}
                    onError={setUploadError}
                >
                    {(open) => (
                        <div className={styles.uploadZone}>
                            <FontAwesomeIcon icon={faImage} className={styles.uploadIcon} aria-hidden="true" />
                            <p className={styles.uploadText}>Aucune image — importez-en une pour dessiner des zones</p>
                            <button type="button" className={styles.uploadButton} onClick={open}>
                                Choisir une image
                            </button>
                            {uploadError && <p className={styles.warning}>{uploadError}</p>}
                        </div>
                    )}
                </FileUploader>
            ) : (
                <>
                    <p className={styles.instructions}>
                        Cliquez-glissez (ou glissez le doigt) sur l'image pour dessiner une zone. Cliquez une
                        zone pour la marquer bonne réponse (plusieurs possibles) — les zones ne peuvent pas se
                        chevaucher.
                    </p>

                    <div
                        ref={imageRef}
                        className={`${zcStyles.imageWrapper} ${styles.drawSurface}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={finishDrawing}
                        onMouseLeave={() => {
                            setDrawStart(null)
                            setDraftRect(null)
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={finishDrawing}
                        onTouchCancel={() => {
                            setDrawStart(null)
                            setDraftRect(null)
                        }}
                    >
                        <img src={exercise.config.image.url} alt="" className={zcStyles.image} draggable={false} />

                        {exercise.config.zones.map((zone) => (
                            <div
                                key={zone.id}
                                className={`${zcStyles.zone} ${styles.editableZone} ${
                                    zone.isCorrect ? zcStyles.correct : ""
                                }`}
                                style={{
                                    left: `${zone.x}%`,
                                    top: `${zone.y}%`,
                                    width: `${zone.width}%`,
                                    height: `${zone.height}%`,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCorrect(zone.id)
                                }}
                            >
                                {zone.isCorrect && (
                                    <span className={styles.correctBadge}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={styles.removeZoneButton}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeZone(zone.id)
                                    }}
                                    aria-label="Retirer cette zone"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        ))}

                        {draftRect && (
                            <div
                                className={styles.draftZone}
                                style={{
                                    left: `${draftRect.x}%`,
                                    top: `${draftRect.y}%`,
                                    width: `${draftRect.width}%`,
                                    height: `${draftRect.height}%`,
                                }}
                            />
                        )}
                    </div>

                    <div className={styles.footerRow}>
                        <span className={styles.zoneCount}>
                            {exercise.config.zones.length}/{MAX_ZONES_CLIQUABLES} zones
                        </span>
                        <FileUploader
                            kinds="image"
                            onUploadComplete={({ url, name }) => {
                                setUploadError(null)
                                onConfigChange({ ...exercise.config, image: { type: "image", url, alt: name } })
                            }}
                            onError={setUploadError}
                        >
                            {(open) => (
                                <button type="button" className={styles.changeImageButton} onClick={open}>
                                    Changer d'image
                                </button>
                            )}
                        </FileUploader>
                    </div>

                    {uploadError && <p className={styles.warning}>{uploadError}</p>}

                    {overlapWarning && (
                        <p className={styles.warning}>
                            Cette zone chevauche une zone existante — les zones ne peuvent pas se superposer.
                        </p>
                    )}

                    {exercise.config.zones.length > 0 && !exercise.config.zones.some((z) => z.isCorrect) && (
                        <p className={styles.warning}> Aucune zone n'est encore marquée comme bonne réponse.</p>
                    )}
                </>
            )}
        </div>
    )
}
