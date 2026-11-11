"use client"

import PhoneNumberInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import fr from "react-phone-number-input/locale/fr"
import "react-phone-number-input/style.css"
import { PAYS_TELEPHONE_PAR_DEFAUT } from "@/constants/telephone"
import styles from "./Input.module.css"

interface PhoneInputProps {
    id: string
    name: string
    label: string
    value: string
    onChange: (value: string) => void
    required?: boolean
}

/** Champ de téléphone avec choix du pays ; rend le numéro au format international (+15145551234). */
export default function PhoneInput({ id, name, label, value, onChange, required }: PhoneInputProps) {
    return (
        <div className={styles.field}>
            <div className={styles.labelRow}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
            </div>
            <PhoneNumberInput
                id={id}
                name={name}
                value={value}
                onChange={(numero) => onChange(numero ?? "")}
                defaultCountry={PAYS_TELEPHONE_PAR_DEFAUT}
                labels={fr}
                flags={flags}
                required={required}
                autoComplete="tel"
                numberInputProps={{ className: styles.input }}
            />
        </div>
    )
}
