import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./PasswordRules.module.css"

interface PasswordRulesProps {
    password: string
}

const RULES = [
    { label: "8 caractères minimum", test: (pw: string) => pw.length >= 8 },
    { label: "Au moins une lettre majuscule", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Au moins une lettre minuscule", test: (pw: string) => /[a-z]/.test(pw) },
    { label: "Au moins un chiffre", test: (pw: string) => /[0-9]/.test(pw) },
]

export function isPasswordValid(password: string): boolean {
    return RULES.every((rule) => rule.test(password))
}

export default function PasswordRules({ password }: PasswordRulesProps) {
    return (
        <div className={styles.wrapper}>
            <p className={styles.title}>Votre mot de passe doit respecter ces règles :</p>
            <ul className={styles.list}>
                {RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                        <li key={rule.label} className={styles.item}>
                            <FontAwesomeIcon
                                icon={passed ? faCheck : faXmark}
                                className={passed ? styles.iconValid : styles.iconInvalid}
                            />
                            <span className={passed ? styles.labelValid : styles.labelInvalid}>{rule.label}</span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
