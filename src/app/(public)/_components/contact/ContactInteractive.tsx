"use client"

import { useState } from "react"
import ContactForm from "./ContactForm"
import SuccessMessage from "./SuccessMessage"
import styles from "./ContactInteractive.module.css"

export default function ContactInteractive() {
    const [submitted, setSubmitted] = useState(false)

    return (
        <div className={styles.card}>
            {submitted ? (
                <SuccessMessage />
            ) : (
                <ContactForm onSubmitSuccess={() => setSubmitted(true)} />
            )}
        </div>
    )
}
