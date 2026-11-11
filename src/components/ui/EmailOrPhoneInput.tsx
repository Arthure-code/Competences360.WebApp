"use client"

import { type ChangeEvent } from "react"
import { AsYouType } from "libphonenumber-js"
import { PAYS_TELEPHONE_PAR_DEFAUT } from "@/constants/telephone"
import Input from "./Input"

interface EmailOrPhoneInputProps {
    id: string
    name: string
    label: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    disabled?: boolean
}

/** Exportée — réutilisée par l'appelant pour savoir où ranger la valeur (email vs phone). */
export function looksLikeEmail(value: string): boolean {
    return /[a-zA-Z@]/.test(value)
}

/** Champ de connexion qui accepte un courriel ou un numéro de téléphone, mis en forme pendant la saisie. */
export default function EmailOrPhoneInput({ id, name, label, value, onChange, required, disabled }: EmailOrPhoneInputProps) {
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const raw = event.target.value

        if (!looksLikeEmail(raw)) {
            onChange(new AsYouType(PAYS_TELEPHONE_PAR_DEFAUT).input(raw))
            return
        }

        // Un courriel qui commence par un chiffre (ex. "123abc@gmail.com")
        // a pu accumuler des caractères de formatage téléphone ("(", ") ",
        // "-") AVANT que la première lettre/@ n'apparaisse et ne bascule
        // ici. On ne nettoie QUE ce segment initial (en ne gardant que ses
        // chiffres) — tout ce qui suit la première lettre/@ est repris tel
        // quel, jamais retouché.
        const firstLetterIndex = raw.search(/[a-zA-Z@]/)
        const leadingDigits = raw.slice(0, firstLetterIndex).replace(/\D/g, "")
        const rest = raw.slice(firstLetterIndex)
        onChange(leadingDigits + rest)
    }

    return (
        <Input
            id={id}
            name={name}
            type="text"
            label={label}
            placeholder="nom@exemple.com ou (514) 555-1234"
            value={value}
            onChange={handleChange}
            required={required}
            disabled={disabled}
            autoComplete="username"
        />
    )
}