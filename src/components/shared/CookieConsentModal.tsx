"use client"

import { useEffect, useState } from "react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useCookieConsent, type ConsentPreferences } from "./CookieConsentProvider"
import Toggle from "@/components/ui/Toggle"
import Button from "@/components/ui/Button"
import styles from "./CookieConsentModal.module.css"

const CATEGORIES = [
    {
        key: "essential" as const,
        title: "Cookies essentiels",
        description:
            "Nécessaires au fonctionnement de la plateforme (connexion, sécurité, progression). Toujours actifs.",
        locked: true,
    },
    {
        key: "analytics" as const,
        title: "Cookies analytiques",
        description:
            "Nous aident à comprendre comment la plateforme est utilisée, de façon anonyme et agrégée.",
        locked: false,
    },
]

export default function CookieConsentModal() {
    const { isModalOpen, closeModal, preferences, savePreferences, acceptAll } = useCookieConsent()
    const [draft, setDraft] = useState<ConsentPreferences>(preferences)

    // Resynchronise le brouillon avec les préférences actuelles à chaque ouverture
    useEffect(() => {
        if (isModalOpen) setDraft(preferences)
    }, [isModalOpen, preferences])

    useEffect(() => {
        if (!isModalOpen) return
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [isModalOpen])

    if (!isModalOpen) return null

    function handleToggle(key: "analytics", value: boolean) {
        setDraft((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <div className={styles.overlay} onClick={closeModal}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label="Préférences de cookies"
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>Préférences de cookies</h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={closeModal}
                        aria-label="Fermer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <p className={styles.intro}>
                    Choisissez les cookies que vous acceptez. Les cookies essentiels ne
                    peuvent pas être désactivés, car ils sont nécessaires au fonctionnement
                    de la plateforme.
                </p>

                <div className={styles.list}>
                    {CATEGORIES.map((category) => (
                        <div key={category.key} className={styles.row}>
                            <div className={styles.rowText}>
                                <p className={styles.rowTitle}>{category.title}</p>
                                <p className={styles.rowDescription}>{category.description}</p>
                            </div>
                            <Toggle
                                checked={draft[category.key]}
                                disabled={category.locked}
                                label={category.title}
                                onChange={
                                    category.locked
                                        ? undefined
                                        : (value) => handleToggle("analytics", value)
                                }
                            />
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <div className={styles.saveWrap}>
                        <Button
                            type="button"
                            label="Enregistrer mes préférences"
                            variant="secondary"
                            fullWidth
                            onClick={() => savePreferences(draft)}
                        />
                    </div>
                    <div className={styles.acceptAllWrap}>
                        <Button
                            type="button"
                            label="Tout accepter"
                            variant="outline"
                            fullWidth
                            onClick={acceptAll}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}