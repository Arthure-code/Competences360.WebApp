"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import styles from "./EditableField.module.css"

interface EditableFieldProps {
    label: string
    value: string
    onSave: (value: string) => void
    /** Ex. "(facultatif, affiché dans l'application)" — accolé au label */
    hint?: string
    type?: "text" | "email"
    className?: string
}

/** Label + valeur, crayon pour passer en édition inline (Enregistrer/Annuler) — réutilisé pour tout champ de profil éditable. */
export default function EditableField({
    label,
    value,
    onSave,
    hint,
    type = "text",
    className = "",
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(value)

    function handleSave() {
        onSave(draft)
        setIsEditing(false)
    }

    function handleCancel() {
        setDraft(value)
        setIsEditing(false)
    }

    return (
        <div className={`${styles.field} ${className}`}>
            <span className={styles.label}>
                {label}
                {hint && <span className={styles.hint}> {hint}</span>}
            </span>

            {isEditing ? (
                <div className={styles.editRow}>
                    <input
                        type={type}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className={styles.input}
                        autoFocus
                    />
                    <Button label="Enregistrer" size="sm" onClick={handleSave} />
                    <Button label="Annuler" size="sm" variant="ghost" onClick={handleCancel} />
                </div>
            ) : (
                <div className={styles.valueRow}>
                    <span className={styles.value}>{value || "—"}</span>
                    <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => setIsEditing(true)}
                        aria-label={`Modifier ${label}`}
                    >
                        <FontAwesomeIcon icon={faPen} />
                    </button>
                </div>
            )}
        </div>
    )
}
