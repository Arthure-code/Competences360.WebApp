"use client"

import { useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faImage } from "@fortawesome/free-solid-svg-icons"
import type { ZoneRemplirExercise, ZoneRemplirFieldType } from "@/types/exercise"
import { zonesOverlap } from "@/lib/zoneOverlap"
import { ZONE_REMPLIR_FIELD_LABELS, getFieldMask, formatZoneRemplirInput, getFixedLength, getFieldTypeHint } from "@/lib/zoneRemplirFieldTypes"
import { CONTENT_TEXT_LIMITS, MAX_ZONES_REMPLIR } from "@/constants/contentLimits"
import FileUploader from "@/components/shared/FileUploader"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import zcStyles from "@/components/exercises/ZoneCliquableRenderer.module.css"
import styles from "./ZoneRemplirEditablePreview.module.css"

interface ZoneRemplirEditablePreviewProps {
    exercise: ZoneRemplirExercise
    onConfigChange: (config: ZoneRemplirExercise["config"]) => void
    onPromptChange: (prompt: string) => void
}

type DraftRect = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number }
type Zone = ZoneRemplirExercise["config"]["zones"][number]

const FIELD_TYPE_KINDS: ZoneRemplirFieldType["kind"][] = [
    "texte_libre",
    "nombre",
    "montant",
    "telephone",
    "code_postal",
    "date",
    "courriel",
    "gabarit",
]

const FIELD_TYPE_SHORT_LABELS: Record<ZoneRemplirFieldType["kind"], string> = {
    texte_libre: "Texte",
    nombre: "Nombre",
    montant: "Montant",
    telephone: "Tél.",
    code_postal: "C.P.",
    date: "Date",
    courriel: "Courriel",
    gabarit: "Gabarit",
}

function defaultFieldTypeFor(kind: ZoneRemplirFieldType["kind"]): ZoneRemplirFieldType {
    if (kind === "montant") return { kind: "montant", symbole: "$", position: "apres" }
    if (kind === "gabarit") return { kind: "gabarit", pattern: "" }
    if (kind === "date") return { kind: "date", format: "jj/mm/aaaa" }
    return { kind } as ZoneRemplirFieldType
}

function resizeWeights(current: number[], newLength: number): number[] {
    const next = current.slice(0, newLength)
    while (next.length < newLength) next.push(1)
    return next
}

function weightsToOffsets(weights: number[]): number[] {
    const total = weights.reduce((sum, w) => sum + w, 0) || 1
    const offsets = [0]
    let cumulative = 0
    for (const w of weights) {
        cumulative += w
        offsets.push(cumulative / total)
    }
    return offsets
}

const MIN_WEIGHT = 0.15

function dragDivider(weights: number[], dividerIndex: number, targetFraction: number): number[] {
    const total = weights.reduce((sum, w) => sum + w, 0)
    const sumBefore = weights.slice(0, dividerIndex).reduce((sum, w) => sum + w, 0)
    const pairTotal = weights[dividerIndex] + weights[dividerIndex + 1]

    let newWeightLeft = targetFraction * total - sumBefore
    newWeightLeft = Math.max(MIN_WEIGHT, Math.min(pairTotal - MIN_WEIGHT, newWeightLeft))
    const newWeightRight = pairTotal - newWeightLeft

    const next = [...weights]
    next[dividerIndex] = newWeightLeft
    next[dividerIndex + 1] = newWeightRight
    return next
}

/**
 * 2e refonte — 3 corrections précises par rapport à la 1ère tentative :
 *
 * 1. UN SEUL axe à la fois (gridAxis, persisté sur chaque zone — voir
 *    types/exercise.ts) — jamais colonnes ET lignes en même temps. Choisi
 *    une fois à la création, ne change plus après.
 * 2. Les pastilles de type sont directement SUR les cellules de bordure
 *    (rangée du haut si axe colonne, colonne de gauche si axe ligne) —
 *    plus de bande séparée au-dessus/à côté de l'image à faire
 *    correspondre visuellement, la pastille EST sur la cellule.
 * 3. Suppression de toute la grille — un badge poubelle TOUJOURS visible
 *    au coin de la grille (pas caché dans un panneau qu'il faut d'abord
 *    sélectionner une cellule pour voir).
 */
export default function ZoneRemplirEditablePreview({
    exercise,
    onConfigChange,
    onPromptChange,
}: ZoneRemplirEditablePreviewProps) {
    const imageRef = useRef<HTMLDivElement>(null)
    const [drawStart, setDrawStart] = useState<Point | null>(null)
    const [draftRect, setDraftRect] = useState<DraftRect | null>(null)
    const [overlapWarning, setOverlapWarning] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
    const [pendingRect, setPendingRect] = useState<DraftRect | null>(null)
    const [gridRows, setGridRows] = useState(1)
    const [gridCols, setGridCols] = useState(1)
    const [gridAssignBy, setGridAssignBy] = useState<"colonne" | "ligne">("colonne")
    const [gridError, setGridError] = useState<string | null>(null)
    const [colWeights, setColWeights] = useState<number[]>([1])
    const [rowWeights, setRowWeights] = useState<number[]>([1])
    const [draggingDivider, setDraggingDivider] = useState<{ axis: "col" | "row"; index: number } | null>(null)
    const [movingZoneId, setMovingZoneId] = useState<string | null>(null)
    const [moveStart, setMoveStart] = useState<Point | null>(null)
    const [moveOrigin, setMoveOrigin] = useState<{ x: number; y: number } | null>(null)
    const [dragMoved, setDragMoved] = useState(false)
    const [moveOverlapWarning, setMoveOverlapWarning] = useState(false)
    const [undoSnapshot, setUndoSnapshot] = useState<Zone[] | null>(null)
    // gridId en attente de confirmation — le badge poubelle ne supprime plus directement, il ouvre ce dialogue d'abord.
    const [pendingDeleteGridId, setPendingDeleteGridId] = useState<string | null>(null)
    // Zoom — purement visuel (largeur CSS explicite), AUCUN impact sur les
    // coordonnées stockées (toujours en %) ni sur getRelativePosition :
    // getBoundingClientRect() retourne déjà la taille RENDUE (donc zoomée),
    // le calcul de % reste juste sans aucun ajustement supplémentaire.
    const [zoomLevel, setZoomLevel] = useState(1)
    const ZOOM_MIN = 0.5
    const ZOOM_MAX = 3
    const ZOOM_STEP = 0.25
    const IMAGE_BASE_WIDTH_PX = 700 // doit correspondre à max-width dans ZoneCliquableRenderer.module.css (.imageWrapper)
    // Hauteur de l'image à 100% (sa vraie proportion, mesurée une fois
    // l'image chargée) — sert à PLAFONNER le conteneur une fois zoomé, pour
    // qu'il reste une fenêtre fixe à naviguer dedans, plutôt que de grandir
    // avec l'image et pousser tout le reste de la page.
    const [baseImageHeight, setBaseImageHeight] = useState<number | null>(null)

    const hasImage = Boolean(exercise.config.image.url)
    const selectedZone = exercise.config.zones.find((z) => z.id === selectedZoneId) ?? null
    const fixedLength = selectedZone ? getFixedLength(selectedZone.fieldType) : undefined

    function getRelativePosition(clientX: number, clientY: number): Point | null {
        if (!imageRef.current) return null
        const rect = imageRef.current.getBoundingClientRect()
        const x = ((clientX - rect.left) / rect.width) * 100
        const y = ((clientY - rect.top) / rect.height) * 100
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
    }

    function startDrawing(target: EventTarget, pos: Point | null) {
        if ((target as HTMLElement).closest?.(`.${styles.zone}`)) return
        if ((target as HTMLElement).closest?.(`.${styles.headerPillOnCell}`)) return
        if ((target as HTMLElement).closest?.(`.${styles.deleteGridBadge}`)) return
        if (exercise.config.zones.length >= MAX_ZONES_REMPLIR) return
        if (pendingRect) return
        if (!pos) return
        // Désélectionne la cellule active en commençant un nouveau dessin — ferme le panneau de config (utile surtout sur mobile, où il prend de la place).
        setSelectedZoneId(null)
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

        setGridRows(1)
        setGridCols(1)
        setGridAssignBy("colonne")
        setColWeights([1])
        setRowWeights([1])
        setGridError(null)
        setPendingRect(draftRect)
        setDraftRect(null)
    }

    function confirmGrid() {
        if (!pendingRect) return
        const totalCells = gridRows * gridCols
        if (exercise.config.zones.length + totalCells > MAX_ZONES_REMPLIR) {
            setGridError(
                `Ça créerait ${totalCells} zone${totalCells > 1 ? "s" : ""}, mais il n'en reste que ${MAX_ZONES_REMPLIR - exercise.config.zones.length} disponible${MAX_ZONES_REMPLIR - exercise.config.zones.length > 1 ? "s" : ""}.`
            )
            return
        }

        const colOffsets = weightsToOffsets(colWeights)
        const rowOffsets = weightsToOffsets(rowWeights)
        const newGridId = crypto.randomUUID()
        const axis: "col" | "row" = gridAssignBy === "colonne" ? "col" : "row"
        const newZones: Zone[] = []

        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const cellX = pendingRect.x + colOffsets[col] * pendingRect.width
                const cellY = pendingRect.y + rowOffsets[row] * pendingRect.height
                const cellWidth = (colOffsets[col + 1] - colOffsets[col]) * pendingRect.width
                const cellHeight = (rowOffsets[row + 1] - rowOffsets[row]) * pendingRect.height
                newZones.push({
                    id: crypto.randomUUID(),
                    x: cellX,
                    y: cellY,
                    width: cellWidth,
                    height: cellHeight,
                    fieldType: { kind: "texte_libre" },
                    expectedAnswer: "",
                    gridId: newGridId,
                    gridRow: row,
                    gridCol: col,
                    gridAxis: axis,
                })
            }
        }

        setUndoSnapshot(exercise.config.zones)
        onConfigChange({ ...exercise.config, zones: [...exercise.config.zones, ...newZones] })
        setPendingRect(null)
        setGridError(null)
        setSelectedZoneId(newZones[0]?.id ?? null)
    }

    function handleUndo() {
        if (!undoSnapshot) return
        onConfigChange({ ...exercise.config, zones: undoSnapshot })
        setUndoSnapshot(null)
        setSelectedZoneId(null)
    }

    /** Reconfigure en bloc toute une colonne OU ligne — appelé par une pastille posée sur une cellule de bordure. */
    function reconfigureAxis(gridId: string, axis: "col" | "row", index: number, newKind: ZoneRemplirFieldType["kind"]) {
        const newFieldType = defaultFieldTypeFor(newKind)
        setUndoSnapshot(exercise.config.zones)
        onConfigChange({
            ...exercise.config,
            zones: exercise.config.zones.map((z) => {
                if (z.gridId !== gridId) return z
                const matches = axis === "col" ? z.gridCol === index : z.gridRow === index
                if (!matches) return z
                return { ...z, fieldType: newFieldType, expectedAnswer: "" }
            }),
        })
    }

    function removeWholeGrid(gridId: string) {
        setUndoSnapshot(exercise.config.zones)
        onConfigChange({ ...exercise.config, zones: exercise.config.zones.filter((z) => z.gridId !== gridId) })
        setSelectedZoneId(null)
    }

    function startDividerDrag(e: React.MouseEvent | React.TouchEvent, axis: "col" | "row", index: number) {
        e.stopPropagation()
        setDraggingDivider({ axis, index })
    }

    function updateDividerDrag(pos: Point | null) {
        if (!draggingDivider || !pendingRect || !pos) return
        if (draggingDivider.axis === "col") {
            const fraction = (pos.x - pendingRect.x) / pendingRect.width
            setColWeights((prev) => dragDivider(prev, draggingDivider.index, fraction))
        } else {
            const fraction = (pos.y - pendingRect.y) / pendingRect.height
            setRowWeights((prev) => dragDivider(prev, draggingDivider.index, fraction))
        }
    }

    function handleMouseDown(e: React.MouseEvent) {
        startDrawing(e.target, getRelativePosition(e.clientX, e.clientY))
    }
    function handleMouseMove(e: React.MouseEvent) {
        updateDrawing(getRelativePosition(e.clientX, e.clientY))
        updateZoneMove(getRelativePosition(e.clientX, e.clientY))
        updateDividerDrag(getRelativePosition(e.clientX, e.clientY))
    }
    function handleTouchStart(e: React.TouchEvent) {
        const touch = e.touches[0]
        if (!touch) return
        startDrawing(e.target, getRelativePosition(touch.clientX, touch.clientY))
    }
    function handleTouchMove(e: React.TouchEvent) {
        const touch = e.touches[0]
        if (!touch) return
        if (drawStart) {
            e.preventDefault()
            updateDrawing(getRelativePosition(touch.clientX, touch.clientY))
        }
        if (movingZoneId) {
            e.preventDefault()
            updateZoneMove(getRelativePosition(touch.clientX, touch.clientY))
        }
        if (draggingDivider) {
            e.preventDefault()
            updateDividerDrag(getRelativePosition(touch.clientX, touch.clientY))
        }
    }

    function startZoneMove(e: React.MouseEvent | React.TouchEvent, zoneId: string) {
        e.stopPropagation()
        const zone = exercise.config.zones.find((z) => z.id === zoneId)
        if (!zone) return
        const point = "touches" in e ? e.touches[0] : e
        if (!point) return
        const pos = getRelativePosition(point.clientX, point.clientY)
        if (!pos) return
        setMovingZoneId(zoneId)
        setMoveStart(pos)
        setMoveOrigin({ x: zone.x, y: zone.y })
        setDragMoved(false)
        setMoveOverlapWarning(false)
    }

    function updateZoneMove(pos: Point | null) {
        if (!movingZoneId || !moveStart || !moveOrigin || !pos) return
        const deltaX = pos.x - moveStart.x
        const deltaY = pos.y - moveStart.y

        if (!dragMoved && Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
        if (!dragMoved) setDragMoved(true)

        const zone = exercise.config.zones.find((z) => z.id === movingZoneId)
        if (!zone) return

        const newX = Math.max(0, Math.min(100 - zone.width, moveOrigin.x + deltaX))
        const newY = Math.max(0, Math.min(100 - zone.height, moveOrigin.y + deltaY))

        onConfigChange({
            ...exercise.config,
            zones: exercise.config.zones.map((z) => (z.id === movingZoneId ? { ...z, x: newX, y: newY } : z)),
        })
    }

    function finishZoneMove(zoneId: string) {
        if (!dragMoved) {
            setSelectedZoneId(zoneId)
        } else if (moveOrigin) {
            const zone = exercise.config.zones.find((z) => z.id === zoneId)
            const others = exercise.config.zones.filter((z) => z.id !== zoneId)
            if (zone && others.some((other) => zonesOverlap(other, zone))) {
                setMoveOverlapWarning(true)
                onConfigChange({
                    ...exercise.config,
                    zones: exercise.config.zones.map((z) => (z.id === zoneId ? { ...z, x: moveOrigin.x, y: moveOrigin.y } : z)),
                })
            }
        }
        setMovingZoneId(null)
        setMoveStart(null)
        setMoveOrigin(null)
        setDragMoved(false)
    }

    function updateZone(zoneId: string, patch: Partial<Zone>) {
        onConfigChange({
            ...exercise.config,
            zones: exercise.config.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...patch } : zone)),
        })
    }

    function removeZone(zoneId: string) {
        setUndoSnapshot(exercise.config.zones)
        onConfigChange({ ...exercise.config, zones: exercise.config.zones.filter((zone) => zone.id !== zoneId) })
        if (selectedZoneId === zoneId) setSelectedZoneId(null)
    }

    // Compte de cellules par grille — sert à savoir si une zone fait partie d'un VRAI groupe (>1) ou est seule (1x1, rien à afficher en plus).
    const gridCellCounts = new Map<string, number>()
    for (const zone of exercise.config.zones) {
        gridCellCounts.set(zone.gridId, (gridCellCounts.get(zone.gridId) ?? 0) + 1)
    }

    // Coin supérieur droit de chaque grille (>1 cellule) — pour le badge de suppression, toujours affiché là, peu importe la cellule sélectionnée.
    const gridDeleteBadges: { gridId: string; x: number; y: number; count: number }[] = []
    for (const [gridId, count] of gridCellCounts) {
        if (count <= 1) continue
        const cells = exercise.config.zones.filter((z) => z.gridId === gridId)
        const maxX = Math.max(...cells.map((c) => c.x + c.width))
        const minY = Math.min(...cells.map((c) => c.y))
        gridDeleteBadges.push({ gridId, x: maxX, y: minY, count })
    }

    return (
        <div className={zcStyles.wrapper}>
            <div className={styles.headerEdit}>
                <span className={styles.tag}>Zone à remplir</span>
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
                <div className={styles.editorLayout}>
                    {/* Colonne/zone image — desktop : colonne de gauche, toujours visible. Mobile : pleine largeur, le panneau de config devient une feuille collée en bas plutôt qu'une 2e colonne (pas la place). */}
                    <div className={styles.imageColumn}>
                        <p className={styles.instructions}>
                            Cliquez-glissez sur l'image pour dessiner une zone — un champ seul, ou un rectangle
                            autour d'un tableau entier. Une fois la grille créée, les pastilles sur sa rangée ou
                            colonne de bordure choisissent le type d'un coup. Cliquez une cellule pour taper sa
                            bonne réponse.
                        </p>

                        <div className={styles.zoomControls}>
                            <button
                                type="button"
                                className={styles.zoomButton}
                                onClick={() => setZoomLevel((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
                                disabled={zoomLevel <= ZOOM_MIN}
                                aria-label="Diminuer le zoom"
                            >
                                −
                            </button>
                            <button type="button" className={styles.zoomReset} onClick={() => setZoomLevel(1)}>
                                {Math.round(zoomLevel * 100)}%
                            </button>
                            <button
                                type="button"
                                className={styles.zoomButton}
                                onClick={() => setZoomLevel((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
                                disabled={zoomLevel >= ZOOM_MAX}
                                aria-label="Augmenter le zoom"
                            >
                                +
                            </button>
                            {zoomLevel !== 1 && (
                                <span className={styles.zoomHint}>Glissez pour naviguer dans l'image agrandie</span>
                            )}
                        </div>

                        <div
                            className={styles.zoomScrollArea}
                            style={zoomLevel > 1 && baseImageHeight ? { maxHeight: `${baseImageHeight}px` } : undefined}
                        >
                            <div
                                ref={imageRef}
                                className={`${zcStyles.imageWrapper} ${styles.drawSurface}`}
                                // Style explicite TOUT LE TEMPS, pas seulement quand zoomé — zcStyles.imageWrapper
                                // n'a qu'un max-width:700px (un plafond, pas une largeur forcée) et compte sur le
                                // comportement "auto" du navigateur pour rétrécir dans un espace plus petit, ce
                                // qui ne se produisait pas de façon fiable ici. width:100% force explicitement
                                // à occuper l'espace RÉELLEMENT disponible à 100% de zoom (jamais plus grand que
                                // le parent) ; au-delà de 100%, une largeur en px prend le relais pour permettre
                                // au zoom de dépasser le cadre visible (zoomScrollArea gère le défilement).
                                style={
                                    zoomLevel === 1
                                        ? { width: "100%", maxWidth: `${IMAGE_BASE_WIDTH_PX}px`, margin: 0 }
                                        : {
                                              width: `${IMAGE_BASE_WIDTH_PX * zoomLevel}px`,
                                              maxWidth: `${IMAGE_BASE_WIDTH_PX * ZOOM_MAX}px`,
                                              margin: 0,
                                          }
                                }
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={() => {
                                    finishDrawing()
                                    if (movingZoneId) finishZoneMove(movingZoneId)
                                    setDraggingDivider(null)
                                }}
                                onMouseLeave={() => {
                                    setDrawStart(null)
                                    setDraftRect(null)
                                    if (movingZoneId) finishZoneMove(movingZoneId)
                                    setDraggingDivider(null)
                                }}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={() => {
                                    finishDrawing()
                                    if (movingZoneId) finishZoneMove(movingZoneId)
                                    setDraggingDivider(null)
                                }}
                                onTouchCancel={() => {
                                    setDrawStart(null)
                                    setDraftRect(null)
                                    if (movingZoneId) finishZoneMove(movingZoneId)
                                    setDraggingDivider(null)
                                }}
                            >
                                <img
                                    src={exercise.config.image.url}
                                    alt=""
                                    className={zcStyles.image}
                                    draggable={false}
                                    onLoad={(e) => {
                                        const img = e.currentTarget
                                        if (img.naturalWidth > 0) {
                                            setBaseImageHeight((img.naturalHeight / img.naturalWidth) * IMAGE_BASE_WIDTH_PX)
                                        }
                                    }}
                                />

                                {exercise.config.zones.map((zone, index) => {
                                    const isMultiCell = (gridCellCounts.get(zone.gridId) ?? 0) > 1
                                    const isAxisLeader = isMultiCell && (zone.gridAxis === "col" ? zone.gridRow === 0 : zone.gridCol === 0)

                                    return (
                                        <div
                                            key={zone.id}
                                            className={`${styles.zone} ${selectedZoneId === zone.id ? styles.zoneSelected : ""} ${movingZoneId === zone.id ? styles.zoneMoving : ""}`}
                                            style={{
                                                left: `${zone.x}%`,
                                                top: `${zone.y}%`,
                                                width: `${zone.width}%`,
                                                height: `${zone.height}%`,
                                            }}
                                            onMouseDown={(e) => startZoneMove(e, zone.id)}
                                            onTouchStart={(e) => startZoneMove(e, zone.id)}
                                        >
                                            <span className={styles.zoneIndex}>{index + 1}</span>

                                            {isAxisLeader && (
                                                <select
                                                    value={zone.fieldType.kind}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                    onChange={(e) =>
                                                        reconfigureAxis(
                                                            zone.gridId,
                                                            zone.gridAxis,
                                                            zone.gridAxis === "col" ? zone.gridCol : zone.gridRow,
                                                            e.target.value as ZoneRemplirFieldType["kind"]
                                                        )
                                                    }
                                                    className={`${styles.headerPillOnCell} ${zone.gridAxis === "col" ? styles.headerPillOnCellTop : styles.headerPillOnCellLeft}`}
                                                    title={`Toute la ${zone.gridAxis === "col" ? "colonne" : "ligne"}`}
                                                >
                                                    {FIELD_TYPE_KINDS.map((k) => (
                                                        <option key={k} value={k}>
                                                            {FIELD_TYPE_SHORT_LABELS[k]}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    )
                                })}

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

                                {pendingRect && (
                                    <div
                                        className={styles.gridPreview}
                                        style={{
                                            left: `${pendingRect.x}%`,
                                            top: `${pendingRect.y}%`,
                                            width: `${pendingRect.width}%`,
                                            height: `${pendingRect.height}%`,
                                        }}
                                    >
                                        {gridCols > 1 &&
                                            weightsToOffsets(colWeights)
                                                .slice(1, -1)
                                                .map((offset, i) => (
                                                    <div
                                                        key={`col-${i}`}
                                                        className={styles.dividerCol}
                                                        style={{ left: `${offset * 100}%` }}
                                                        onMouseDown={(e) => startDividerDrag(e, "col", i)}
                                                        onTouchStart={(e) => startDividerDrag(e, "col", i)}
                                                    />
                                                ))}
                                        {gridRows > 1 &&
                                            weightsToOffsets(rowWeights)
                                                .slice(1, -1)
                                                .map((offset, i) => (
                                                    <div
                                                        key={`row-${i}`}
                                                        className={styles.dividerRow}
                                                        style={{ top: `${offset * 100}%` }}
                                                        onMouseDown={(e) => startDividerDrag(e, "row", i)}
                                                        onTouchStart={(e) => startDividerDrag(e, "row", i)}
                                                    />
                                                ))}
                                    </div>
                                )}

                                {gridDeleteBadges.map((badge) => (
                                    <button
                                        key={badge.gridId}
                                        type="button"
                                        className={styles.deleteGridBadge}
                                        style={{ left: `${badge.x}%`, top: `${badge.y}%` }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={() => setPendingDeleteGridId(badge.gridId)}
                                        title={`Supprimer toute la grille (${badge.count} cellules)`}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {pendingRect && (gridRows > 1 || gridCols > 1) && (
                            <p className={styles.fixedLengthNote}>
                                Glissez un trait pour ajuster la largeur d'une colonne ou la hauteur d'une ligne.
                            </p>
                        )}

                        <div className={styles.footerRow}>
                            <span className={styles.zoneCount}>
                                {exercise.config.zones.length}/{MAX_ZONES_REMPLIR} zones
                            </span>
                            {undoSnapshot && (
                                <button type="button" className={styles.undoButton} onClick={handleUndo}>
                                    ↺ Annuler la dernière action
                                </button>
                            )}
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
                        {moveOverlapWarning && (
                            <p className={styles.warning}>
                                Cette position chevaucherait une autre zone — déplacement annulé, remise à sa
                                position d'origine.
                            </p>
                        )}
                    </div>

                    {/* Colonne/panneau de config — desktop : colonne de droite, TOUJOURS visible au même
                        endroit (change de contenu selon le contexte). Mobile : feuille collée en bas de
                        l'écran, affichée SEULEMENT s'il y a vraiment quelque chose à configurer (pas de
                        placeholder vide qui prendrait de la place pour rien sur petit écran). */}
                    {(pendingRect || selectedZone) && (
                        <div className={styles.configColumn}>
                            <button
                                type="button"
                                className={styles.configColumnCloseMobile}
                                onClick={() => {
                                    setPendingRect(null)
                                    setSelectedZoneId(null)
                                }}
                                aria-label="Fermer"
                            >
                                ✕
                            </button>

                            {pendingRect && (
                                <div className={styles.gridConfigPanel}>
                                    <div className={styles.row}>
                                        <label className={styles.field}>
                                            <span className={styles.fieldLabel}>Lignes</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={MAX_ZONES_REMPLIR}
                                                value={gridRows}
                                                onChange={(e) => {
                                                    const newRows = Math.max(1, Number(e.target.value) || 1)
                                                    setGridRows(newRows)
                                                    setRowWeights((prev) => resizeWeights(prev, newRows))
                                                }}
                                                className={styles.input}
                                            />
                                        </label>
                                        <label className={styles.field}>
                                            <span className={styles.fieldLabel}>Colonnes</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={MAX_ZONES_REMPLIR}
                                                value={gridCols}
                                                onChange={(e) => {
                                                    const newCols = Math.max(1, Number(e.target.value) || 1)
                                                    setGridCols(newCols)
                                                    setColWeights((prev) => resizeWeights(prev, newCols))
                                                }}
                                                className={styles.input}
                                            />
                                        </label>
                                    </div>

                                    {(gridRows > 1 || gridCols > 1) && (
                                        <div className={styles.field}>
                                            <span className={styles.fieldLabel}>Configurer le type par</span>
                                            <span className={styles.fieldHint}>
                                                Un seul choix pour toute la grille — jamais les deux à la fois.
                                            </span>
                                            <div className={styles.assignByToggle}>
                                                <button
                                                    type="button"
                                                    className={gridAssignBy === "colonne" ? styles.assignByActive : styles.assignByOption}
                                                    onClick={() => setGridAssignBy("colonne")}
                                                >
                                                    Colonne
                                                </button>
                                                <button
                                                    type="button"
                                                    className={gridAssignBy === "ligne" ? styles.assignByActive : styles.assignByOption}
                                                    onClick={() => setGridAssignBy("ligne")}
                                                >
                                                    Ligne
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <p className={styles.fixedLengthNote}>
                                        {gridRows * gridCols === 1
                                            ? "Créera 1 zone, directement — cliquez-la ensuite pour taper sa bonne réponse."
                                            : `Créera ${gridRows * gridCols} zones en "Texte libre" — les pastilles sur la ${gridAssignBy === "colonne" ? "rangée du haut" : "colonne de gauche"} choisissent le type ensuite.`}
                                    </p>

                                    {gridError && <p className={styles.warning}>{gridError}</p>}

                                    <div className={styles.gridConfigActions}>
                                        <button type="button" className={styles.changeImageButton} onClick={() => setPendingRect(null)}>
                                            Annuler
                                        </button>
                                        <button type="button" className={styles.uploadButton} onClick={confirmGrid}>
                                            {gridRows * gridCols === 1 ? "Créer la zone" : "Créer la grille"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedZone && (
                                <div className={styles.zoneConfigPanel}>
                                    <div className={styles.zoneConfigHeader}>
                                        <span className={styles.zoneConfigTitle}>
                                            Zone {exercise.config.zones.findIndex((z) => z.id === selectedZone.id) + 1}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.removeZoneButton}
                                            onClick={() => removeZone(selectedZone.id)}
                                            aria-label="Retirer cette zone"
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Retirer cette cellule
                                        </button>
                                    </div>

                                    <label className={styles.field}>
                                        <span className={styles.fieldLabel}>Type de champ</span>
                                        <select
                                            value={selectedZone.fieldType.kind}
                                            onChange={(e) =>
                                                updateZone(selectedZone.id, {
                                                    fieldType: defaultFieldTypeFor(e.target.value as ZoneRemplirFieldType["kind"]),
                                                    expectedAnswer: "",
                                                })
                                            }
                                            className={styles.input}
                                        >
                                            {FIELD_TYPE_KINDS.map((kind) => (
                                                <option key={kind} value={kind}>
                                                    {ZONE_REMPLIR_FIELD_LABELS[kind]}
                                                </option>
                                            ))}
                                        </select>
                                        <span className={styles.fieldHint}>{getFieldTypeHint(selectedZone.fieldType)}</span>
                                    </label>

                                    {selectedZone.fieldType.kind === "montant" && (
                                        <div className={styles.row}>
                                            <label className={styles.field}>
                                                <span className={styles.fieldLabel}>Symbole</span>
                                                <input
                                                    type="text"
                                                    value={selectedZone.fieldType.symbole}
                                                    onChange={(e) =>
                                                        updateZone(selectedZone.id, {
                                                            fieldType: { ...selectedZone.fieldType, kind: "montant", symbole: e.target.value } as ZoneRemplirFieldType,
                                                        })
                                                    }
                                                    className={styles.input}
                                                    maxLength={3}
                                                />
                                            </label>
                                            <label className={styles.field}>
                                                <span className={styles.fieldLabel}>Position</span>
                                                <select
                                                    value={selectedZone.fieldType.position}
                                                    onChange={(e) =>
                                                        updateZone(selectedZone.id, {
                                                            fieldType: {
                                                                ...selectedZone.fieldType,
                                                                kind: "montant",
                                                                position: e.target.value as "avant" | "apres",
                                                            } as ZoneRemplirFieldType,
                                                        })
                                                    }
                                                    className={styles.input}
                                                >
                                                    <option value="avant">Avant le nombre</option>
                                                    <option value="apres">Après le nombre</option>
                                                </select>
                                            </label>
                                        </div>
                                    )}

                                    {selectedZone.fieldType.kind === "date" && (
                                        <label className={styles.field}>
                                            <span className={styles.fieldLabel}>Format</span>
                                            <select
                                                value={selectedZone.fieldType.format}
                                                onChange={(e) =>
                                                    updateZone(selectedZone.id, {
                                                        fieldType: { kind: "date", format: e.target.value as "jj/mm/aaaa" | "mm/jj/aaaa" | "aaaa-mm-jj" },
                                                        expectedAnswer: "",
                                                    })
                                                }
                                                className={styles.input}
                                            >
                                                <option value="jj/mm/aaaa">JJ/MM/AAAA</option>
                                                <option value="mm/jj/aaaa">MM/JJ/AAAA</option>
                                                <option value="aaaa-mm-jj">AAAA-MM-JJ</option>
                                            </select>
                                        </label>
                                    )}

                                    {selectedZone.fieldType.kind === "gabarit" && (
                                        <label className={styles.field}>
                                            <span className={styles.fieldLabel}>Gabarit</span>
                                            <span className={styles.fieldHint}># = chiffre, A = lettre, * = n'importe quel caractère, tout autre caractère (tiret, slash...) est pré-rempli</span>
                                            <input
                                                type="text"
                                                value={selectedZone.fieldType.pattern}
                                                onChange={(e) => {
                                                    const newFieldType: ZoneRemplirFieldType = { kind: "gabarit", pattern: e.target.value }
                                                    updateZone(selectedZone.id, {
                                                        fieldType: newFieldType,
                                                        expectedAnswer: formatZoneRemplirInput(newFieldType, selectedZone.expectedAnswer),
                                                    })
                                                }}
                                                className={styles.input}
                                                placeholder="Ex. AA#AAAAA-AAAAA#"
                                            />
                                        </label>
                                    )}

                                    <label className={styles.field}>
                                        <span className={styles.fieldLabel}>
                                            Bonne réponse attendue
                                            {fixedLength === undefined && (
                                                <span className={styles.charCounter}>
                                                    {" "}
                                                    ({selectedZone.expectedAnswer.length}
                                                    {selectedZone.maxLength ? `/${selectedZone.maxLength}` : ""} caractères)
                                                </span>
                                            )}
                                        </span>
                                        <input
                                            type="text"
                                            value={selectedZone.expectedAnswer}
                                            onChange={(e) => {
                                                let formatted = formatZoneRemplirInput(selectedZone.fieldType, e.target.value)
                                                if (selectedZone.maxLength) formatted = formatted.slice(0, selectedZone.maxLength)
                                                updateZone(selectedZone.id, { expectedAnswer: formatted })
                                            }}
                                            className={styles.input}
                                            placeholder={getFieldMask(selectedZone.fieldType) || "Réponse attendue"}
                                        />
                                    </label>

                                    {fixedLength !== undefined ? (
                                        <p className={styles.fixedLengthNote}>
                                            Longueur fixée automatiquement par le format choisi ({fixedLength} caractère
                                            {fixedLength > 1 ? "s" : ""}) — rien à configurer.
                                        </p>
                                    ) : (
                                        <label className={styles.field}>
                                            <span className={styles.fieldLabel}>Limite de caractères (facultatif)</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={selectedZone.maxLength ?? ""}
                                                onChange={(e) =>
                                                    updateZone(selectedZone.id, {
                                                        maxLength: e.target.value ? Number(e.target.value) : undefined,
                                                    })
                                                }
                                                className={styles.input}
                                            />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingDeleteGridId !== null}
                title="Supprimer toute la grille ?"
                message={
                    pendingDeleteGridId
                        ? `Les ${gridCellCounts.get(pendingDeleteGridId) ?? 0} cellules de ce tableau seront retirées d'un coup. Utilisez "Annuler la dernière action" ensuite si c'est une erreur.`
                        : ""
                }
                confirmLabel="Supprimer la grille"
                onConfirm={() => {
                    if (pendingDeleteGridId) removeWholeGrid(pendingDeleteGridId)
                    setPendingDeleteGridId(null)
                }}
                onCancel={() => setPendingDeleteGridId(null)}
            />
        </div>
    )
}