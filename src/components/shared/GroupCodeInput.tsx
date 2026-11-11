"use client"

import { useRef, useState, type ChangeEvent } from "react"
import styles from "./GroupCodeInput.module.css"

const GROUP_LENGTH = 4
const MAX_RAW_LENGTH = GROUP_LENGTH * 2
const MASK_CHAR = "X"

interface GroupCodeInputProps {
    value: string
    onChange: (value: string) => void
    hasError?: boolean
}

function formatCode(raw: string): string {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, MAX_RAW_LENGTH)
    if (cleaned.length > GROUP_LENGTH) return `${cleaned.slice(0, GROUP_LENGTH)}-${cleaned.slice(GROUP_LENGTH)}`
    return cleaned
}

export default function GroupCodeInput({ value, onChange, hasError = false }: GroupCodeInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        onChange(formatCode(event.target.value))
    }

    function focusInput() {
        inputRef.current?.focus()
    }

    // value peut contenir le tiret ("AB12-CD"); on ne garde que les caractères
    // réels pour savoir combien de X ont déjà été remplacés.
    const rawValue = value.replace("-", "")
    const chars = rawValue.padEnd(MAX_RAW_LENGTH, MASK_CHAR).split("")
    const first = chars.slice(0, GROUP_LENGTH)
    const second = chars.slice(GROUP_LENGTH, MAX_RAW_LENGTH)

    const estComplet = rawValue.length >= MAX_RAW_LENGTH

    // Un code complet est sélectionné à la prise de focus : la frappe suivante
    // le remplace en entier. Sans ça, taper sur un champ plein ne produit rien,
    // et le champ paraît figé après un code refusé.
    function handleFocus() {
        setIsFocused(true)
        if (estComplet) inputRef.current?.select()
    }

    // Position (0 à 7) du prochain caractère à saisir. -1 quand le champ n'a
    // pas le focus ou que le code est complet.
    const activeIndex = isFocused && !estComplet ? rawValue.length : -1

    function slotClassName(globalIndex: number) {
        return [
            styles.charSlot,
            globalIndex < rawValue.length ? styles.filled : styles.placeholder,
            globalIndex === activeIndex ? styles.active : "",
            // Curseur après le dernier caractère quand le code est complet :
            // le champ reste visiblement vivant.
            isFocused && estComplet && globalIndex === MAX_RAW_LENGTH - 1 ? styles.activeEnd : "",
        ].join(" ")
    }

    return (
        <div className={styles.wrapper} onClick={focusInput}>
            <div
                className={`${styles.display} ${hasError ? styles.displayError : ""}`}
                aria-hidden="true"
            >
                {first.map((char, index) => (
                    <span key={`first-${index}`} className={slotClassName(index)}>
                        {char}
                    </span>
                ))}
                <span className={rawValue.length >= GROUP_LENGTH ? styles.filled : styles.separator}>
                    -
                </span>
                {second.map((char, index) => (
                    <span key={`second-${index}`} className={slotClassName(index + GROUP_LENGTH)}>
                        {char}
                    </span>
                ))}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={() => setIsFocused(false)}
                maxLength={9}
                autoComplete="off"
                autoCapitalize="characters"
                aria-label="Code de groupe"
                className={styles.hiddenInput}
            />
        </div>
    )
}