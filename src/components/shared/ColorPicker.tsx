"use client"

import { CATEGORY_COLOR_PALETTE } from "@/constants/categoryColors"
import styles from "./ColorPicker.module.css"

interface ColorPickerProps {
    value?: string
    onSelect: (hex: string) => void
}

/** Palette fermée (voir constants/categoryColors.ts) — pas de sélecteur hex libre, un choix parmi un ensemble restreint et cohérent avec les couleurs déjà utilisées ailleurs dans l'app. */
export default function ColorPicker({ value, onSelect }: ColorPickerProps) {
    return (
        <div className={styles.grid}>
            {CATEGORY_COLOR_PALETTE.map((color) => (
                <button
                    key={color.hex}
                    type="button"
                    className={`${styles.swatch} ${value === color.hex ? styles.swatchActive : ""}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => onSelect(color.hex)}
                    title={color.label}
                    aria-label={color.label}
                    aria-pressed={value === color.hex}
                />
            ))}
        </div>
    )
}
