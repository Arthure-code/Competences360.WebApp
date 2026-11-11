import Link from "next/link"
import { faBuilding, faEnvelope } from "@fortawesome/free-solid-svg-icons"
import LegalArticle, { type LegalSection } from "@/app/(public)/(legal)/_components/shared/LegalArticle"
import LegalCallout from "@/app/(public)/(legal)/_components/shared/LegalCallout"
import CookieTable from "@/app/(public)/(legal)/_components/shared/CookieTable"
import IconFeatureGrid from "@/app/(public)/(legal)/_components/shared/IconFeatureGrid"
import PillBadge from "@/app/(public)/(legal)/_components/shared/PillBadge"
import SettingsPath from "@/app/(public)/(legal)/_components/shared/SettingsPath"
import DarkContactBox from "@/app/(public)/(legal)/_components/shared/DarkContactBox"
import styles from "./page.module.css"
import OpenCookieSettingsButton from "@/components/shared/OpenCookieSettingsButton"
import Button from "@/components/ui/Button"

const SECTIONS: LegalSection[] = [
    {
        title: "Les cookies que nous utilisons",
        content: (
            <>
                <p>Nous utilisons uniquement des cookies nécessaires au bon fonctionnement de la plateforme.</p>
                <CookieTable
                    rows={[
                        {
                            name: "session_token",
                            type: "Essentiel",
                            purpose: "Maintenir votre connexion active",
                            duration: "Durée de la session",
                        },
                        {
                            name: "last_activity",
                            type: "Essentiel",
                            purpose: "Mémoriser votre dernière activité pour la reprise automatique",
                            duration: "30 jours",
                        },
                        {
                            name: "analytics_id",
                            type: "Analytique",
                            purpose: "Mesurer l'audience de façon anonyme et agrégée",
                            duration: "90 jours",
                        },
                    ]}
                />
            </>
        ),
    },
    {
        title: "Ce que nous n'utilisons pas",
        content: (
            <IconFeatureGrid
                variant="negative"
                items={[
                    {
                        icon: faBuilding,
                        title: "Cookies publicitaires",
                        description: "Aucun ciblage publicitaire n'est effectué sur cette plateforme.",
                    },
                    {
                        icon: faBuilding,
                        title: "Cookies de suivi tiers",
                        description: "Pas de Google Ads, Facebook Pixel ou autres traceurs tiers.",
                    },
                    {
                        icon: faBuilding,
                        title: "Revente de données",
                        description: "Vos données ne sont jamais vendues à des partenaires commerciaux.",
                    },
                    {
                        icon: faBuilding,
                        title: "Tout autre cookie non essentiel",
                        description: "Aucun cookie non nécessaire au fonctionnement de la plateforme n'est utilisé.",
                    },
                ]}
            />
        ),
    },
    {
        title: "Cookies essentiels — pourquoi ils ne peuvent pas être désactivés",
        content: (
            <p>
                Les cookies dits « essentiels » sont indispensables au fonctionnement
                technique de notre plateforme. Sans eux, vous ne pourriez pas rester
                connecté à votre compte, accéder à vos cours sécurisés ou sauvegarder
                votre progression au sein des modules de formation. Pour ces raisons, ils
                sont activés par défaut et ne nécessitent pas de consentement préalable.
            </p>
        ),
    },
    {
        title: "Durée de conservation",
        content: (
            <div className={styles.durationGrid}>
                <div className={styles.durationCard}>
                    <p className={styles.durationTitle}>Cookies de session</p>
                    <p className={styles.durationText}>
                        Ces fichiers sont temporaires et sont automatiquement supprimés dès
                        que vous fermez votre navigateur.
                    </p>
                </div>
                <div className={styles.durationCard}>
                    <p className={styles.durationTitle}>Cookies persistants</p>
                    <p className={styles.durationText}>
                        Ces fichiers restent sur votre appareil jusqu'à leur date
                        d'expiration ou jusqu'à ce que vous les supprimiez
                        manuellement.
                    </p>
                </div>
            </div>
        ),
    },
    {
        title: "Gérer vos préférences",
        content: (
            <>
                <p className={styles.subheading}>Via la plateforme</p>
                <OpenCookieSettingsButton label="Gérer mes préférences" variant="secondary" />

                <p className={styles.subheading}>Via votre navigateur</p>
                <div className={styles.pillRow}>
                    <PillBadge label="Chrome" href="https://support.google.com/chrome/answer/95647" />
                    <PillBadge label="Firefox" href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox" />
                    <PillBadge label="Safari" href="https://support.apple.com/fr-ca/guide/safari/sfri11471/mac" />
                    <PillBadge label="Edge" href="https://support.microsoft.com/fr-fr/microsoft-edge" />
                </div>

                <LegalCallout variant="info">
                    Note : Si vous choisissez de bloquer tous les cookies via votre
                    navigateur, certaines parties de notre plateforme risquent de ne plus
                    fonctionner correctement (notamment l'accès à votre espace
                    membre).
                </LegalCallout>
            </>
        ),
    },
    {
        title: "Nous contacter",
        content: (
            <>
                <p>
                    Pour toute question concernant ces conditions, veuillez nous contacter via
                    notre{" "}
                    <Link href="/contact" className={styles.inlineLink}>
                        formulaire de contact <span aria-hidden="true">→</span>
                    </Link>
                </p>
            </>
        ),
    },
]

export default function PolitiqueCookies() {
    return (
        <LegalArticle
            pageTitle="Politique de cookies"
            orgLine="La Griffe d'Alpha — Compétences 360"
            lastUpdated="28 juin 2026"
            sections={SECTIONS}
        />
    )
}