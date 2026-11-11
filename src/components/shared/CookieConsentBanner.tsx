"use client"

import Link from "next/link"
import { faCookieBite } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useCookieConsent } from "./CookieConsentProvider"
import Button from "@/components/ui/Button"
import styles from "./CookieConsentBanner.module.css"

export default function CookieConsentBanner() {
    const { isBannerVisible, acceptAll, rejectAll, openModal } = useCookieConsent()

    if (!isBannerVisible) return null

    return (
        <div className={styles.wrapper} role="dialog" aria-label="Préférences de cookies">
            <div className={styles.card}>
                <div className={styles.iconWrap}>
                    <FontAwesomeIcon icon={faCookieBite} className={styles.icon} aria-hidden="true" />
                </div>

                <p className={styles.text}>
                    Nous utilisons des cookies essentiels pour le bon fonctionnement de la
                    plateforme. Aucun cookie publicitaire n'est utilisé.{" "}
                    <Link href="/cookies" className={styles.link}>
                        En savoir plus <span aria-hidden="true">→</span>
                    </Link>
                </p>

                <div className={styles.actions}>
                    <div className={styles.acceptWrap}>
                        <Button type="button" label="Accepter" variant="secondary" onClick={acceptAll} />
                    </div>
                    <div className={styles.rejectWrap}>
                        <Button type="button" label="Refuser" variant="outline" onClick={rejectAll} />
                    </div>
                    <div className={styles.customizeWrap}>
                        <Button type="button" label="Personnaliser" variant="ghost" onClick={openModal} />
                    </div>
                </div>
            </div>
        </div>
    )
}