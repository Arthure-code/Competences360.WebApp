"use client"

import { useState, type SyntheticEvent } from "react"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Button from "@/components/ui/Button"
import styles from "./ContactForm.module.css"

const SUBJECTS = [
    { value: "question-generale", label: "Question générale" },
    { value: "probleme-technique", label: "Problème technique" },
    { value: "facturation", label: "Facturation" },
    { value: "autre", label: "Autre" },
]

interface ContactFormProps {
    onSubmitSuccess: () => void
}

export default function ContactForm({ onSubmitSuccess }: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState("")

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const payload = Object.fromEntries(formData.entries())

        try {
            // TODO: brancher sur l'API / le service d'envoi réel
            await new Promise((resolve) => setTimeout(resolve, 600))
            console.log("Contact form payload:", payload)
            onSubmitSuccess()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="firstName" className={styles.label}>
                        Prénom
                    </label>
                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Ex: Jean"
                        className={styles.input}
                        autoComplete="given-name"
                        required
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="lastName" className={styles.label}>
                        Nom
                    </label>
                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Ex: Tremblay"
                        className={styles.input}
                        autoComplete="family-name"
                        required
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                    Adresse courriel
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@courriel.ca"
                    className={styles.input}
                    autoComplete="email"
                    required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="subject" className={styles.label}>
                    Sujet
                </label>
                <div className={styles.selectWrapper}>
                    <select
                        id="subject"
                        name="subject"
                        className={styles.select}
                        value={selectedSubject}
                        onChange={(event) => setSelectedSubject(event.target.value)}
                        required
                    >
                        <option value="" disabled>
                            Sélectionnez un sujet
                        </option>
                        {SUBJECTS.map((subject) => (
                            <option key={subject.value} value={subject.value}>
                                {subject.label}
                            </option>
                        ))}
                    </select>
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={styles.selectIcon}
                        aria-hidden="true"
                    />
                </div>
            </div>

            {selectedSubject === "autre" && (
                <div className={styles.field}>
                    <label htmlFor="otherSubject" className={styles.label}>
                        Précisez votre sujet
                    </label>
                    <input
                        id="otherSubject"
                        name="otherSubject"
                        type="text"
                        placeholder="Ex: Question sur la facturation d'un module"
                        className={styles.input}
                        required
                    />
                </div>
            )}

            <div className={styles.field}>
                <label htmlFor="message" className={styles.label}>
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    placeholder="Comment pouvons-nous vous aider ?"
                    className={styles.textarea}
                    rows={5}
                    required
                />
            </div>

            <label className={styles.consent}>
                <input
                    type="checkbox"
                    name="consent"
                    className={styles.checkbox}
                    required
                />
                <span>
                    J'accepte que mes données soient traitées conformément à la{" "}
                    <a href="/politique-de-confidentialite" className={styles.consentLink}>
                        Politique de confidentialité
                    </a>
                    .
                </span>
            </label>

            <Button
                type="submit"
                label={isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                variant="secondary"
                fullWidth
                disabled={isSubmitting}
            />
        </form>
    )
}