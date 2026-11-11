"use client"

import styles from "./ExercisePreviewToggle.module.css"

interface ExercisePreviewToggleProps {
    mode: "edit" | "test"
    onChange: (mode: "edit" | "test") => void
}

/**
 * "Modifier" = édition interactive (cliquer directement sur
 * le rendu). "Tester" = rejoue le VRAI renderer apprenant, verrouillé,
 * pour se rassurer sans risquer de modifier le contenu par erreur.
 */
export default function ExercisePreviewToggle({ mode, onChange }: ExercisePreviewToggleProps) {
    return (
        <div className={styles.toggle} role="tablist" aria-label="Mode d'affichage de l'exercice">
            <button
                type="button"
                role="tab"
                aria-selected={mode === "edit"}
                className={`${styles.option} ${mode === "edit" ? styles.optionActive : ""}`}
                onClick={() => onChange("edit")}
            >
                Modifier
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={mode === "test"}
                className={`${styles.option} ${mode === "test" ? styles.optionActive : ""}`}
                onClick={() => onChange("test")}
            >
                Tester
            </button>
        </div>
    )
}
