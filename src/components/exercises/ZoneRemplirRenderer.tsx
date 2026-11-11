"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import type { ZoneRemplirExercise } from "@/types/exercise"
import type { ExerciseRendererProps } from "./registry"
import ExerciseQuestionHeader from "./ExerciseQuestionHeader"
import Button from "@/components/ui/Button"
import { getFieldMask, formatZoneRemplirInput, isZoneRemplirAnswerCorrect, getNativeInputType, getFieldTypeHint } from "@/lib/zoneRemplirFieldTypes"
import zcStyles from "./ZoneCliquableRenderer.module.css"
import styles from "./ZoneRemplirRenderer.module.css"

type ZoneState = "default" | "correct" | "incorrect"

/**
 * Réutilise zcStyles.wrapper/.imageWrapper/.image/.actionRow TELS QUELS
 * (vrai fichier, ZoneCliquableRenderer.module.css) — même mise en page
 * exacte que Zone cliquable (largeur max 700px centrée, line-height: 0).
 * Seule .zone/.zoneInput sont propres à ce fichier : un champ texte, pas
 * un bouton, a besoin d'un style différent.
 *
 * draft est Record<string, string> (zoneId -> texte tapé), même forme
 * que reponse_courte. Le masque (getFieldMask) s'affiche en placeholder
 * tant que le champ est vide, jamais tapé par l'apprenant lui-même.
 *
 * Légende numérotée sous l'image, TOUJOURS visible — pas une infobulle
 * au survol (title/aria-label gardés en plus, mais `title` ne s'affiche
 * jamais au toucher sur mobile/tablette, très utilisé sur cette
 * plateforme). Chaque zone porte son numéro, la légende explique ce
 * numéro juste en dessous — fonctionne identiquement sur mobile et
 * desktop, rien à toucher pour la voir.
 */
export default function ZoneRemplirRenderer({
    exercise,
    lastAnswer,
    isLocked,
    draft,
    onDraftChange,
    onSubmit,
}: ExerciseRendererProps<ZoneRemplirExercise>) {
    const submittedValues = lastAnswer?.type === "zone_remplir" ? lastAnswer.values : null
    const draftValues = (draft as Record<string, string> | undefined) ?? {}

    const isAnswered = submittedValues !== null

    function handleFieldChange(
        zoneId: string,
        rawValue: string,
        maxLength: number | undefined,
        fieldType: (typeof exercise.config.zones)[number]["fieldType"]
    ) {
        if (isAnswered) return
        let formatted = formatZoneRemplirInput(fieldType, rawValue)
        if (maxLength) formatted = formatted.slice(0, maxLength)
        onDraftChange({ ...draftValues, [zoneId]: formatted })
    }

    function handleSubmit() {
        onSubmit({ type: "zone_remplir", values: draftValues })
    }

    const allFilled = exercise.config.zones.every((zone) => (draftValues[zone.id] ?? "").trim().length > 0)

    return (
        <div className={zcStyles.wrapper}>
            <ExerciseQuestionHeader exercise={exercise} />

            <div className={zcStyles.imageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={exercise.config.image.url}
                    alt={exercise.config.image.alt ?? ""}
                    className={zcStyles.image}
                />

                {exercise.config.zones.map((zone, index) => {
                    const value = isAnswered ? (submittedValues?.[zone.id] ?? "") : (draftValues[zone.id] ?? "")

                    let state: ZoneState = "default"
                    if (isAnswered && isLocked) {
                        const correct = isZoneRemplirAnswerCorrect(zone.fieldType, value, zone.expectedAnswer)
                        state = correct ? "correct" : "incorrect"
                    }

                    return (
                        <div
                            key={zone.id}
                            // zcStyles[state] (.correct/.incorrect du vrai fichier) sur le PARENT — le CSS réel colore .resultIcon via un sélecteur descendant (".correct .resultIcon"), pas une classe directement sur l'icône.
                            className={`${styles.zone} ${state !== "default" ? zcStyles[state] : ""}`}
                            style={{
                                left: `${zone.x}%`,
                                top: `${zone.y}%`,
                                width: `${zone.width}%`,
                                height: `${zone.height}%`,
                            }}
                        >
                            <span className={styles.zoneIndex}>{index + 1}</span>
                            <input
                                type={getNativeInputType(zone.fieldType)}
                                value={value}
                                onChange={(e) => handleFieldChange(zone.id, e.target.value, zone.maxLength, zone.fieldType)}
                                placeholder={getFieldMask(zone.fieldType)}
                                disabled={isAnswered}
                                className={styles.zoneInput}
                                // title : bonus pour qui survole à la souris, mais la vraie source
                                // d'explication est la légende sous l'image (toujours visible, aussi
                                // sur mobile). aria-label reprend le même texte pour les lecteurs
                                // d'écran, peu importe l'appareil.
                                title={getFieldTypeHint(zone.fieldType)}
                                aria-label={`Zone ${index + 1} à remplir — ${getFieldTypeHint(zone.fieldType)}`}
                            />
                            {(state === "correct" || state === "incorrect") && (
                                <span className={`${zcStyles.resultIcon} ${styles.resultIconPosition}`}>
                                    <FontAwesomeIcon icon={state === "correct" ? faCheck : faXmark} />
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <ul className={styles.legend}>
                {exercise.config.zones.map((zone, index) => (
                    <li key={zone.id} className={styles.legendItem}>
                        <span className={styles.legendIndex}>{index + 1}</span>
                        <span>{getFieldTypeHint(zone.fieldType)}</span>
                    </li>
                ))}
            </ul>

            {!isAnswered && (
                <div className={zcStyles.actionRow}>
                    <Button
                        label="Valider ma réponse"
                        variant="secondary"
                        size="lg"
                        disabled={!allFilled}
                        onClick={handleSubmit}
                    />
                </div>
            )}
        </div>
    )
}