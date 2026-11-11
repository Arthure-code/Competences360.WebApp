import PageHeader from "@/components/ui/PageHeader"
import NotificationsCard, { APPRENANT_NOTIFICATION_PREFS } from "@/components/parametres/NotificationsCard"
import LanguageCard from "@/components/parametres/LanguageCard"
import PrivacyCard from "@/components/parametres/PrivacyCard"
import styles from "./page.module.css"

/**
 * Non monolithique : chaque bloc est indépendant. NotificationsCard est
 * pilotée par données (voir components/parametres/NotificationsCard.tsx),
 * cette page fournit APPRENANT_NOTIFICATION_PREFS ; Langue et
 * Confidentialité sont déjà communs à tous les rôles, sans changement à
 * prévoir.
 */
export default function ApprenantParametresPage() {
    return (
        <div className={styles.page}>
            <PageHeader title="Paramètres" subtitle="Personnalisez votre expérience sur la plateforme" />

            <NotificationsCard prefs={APPRENANT_NOTIFICATION_PREFS} />
            <LanguageCard />
            <PrivacyCard />
        </div>
    )
}