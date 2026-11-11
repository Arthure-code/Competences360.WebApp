import PageHeader from "@/components/ui/PageHeader"
import NotificationsCard, { FORMATEUR_NOTIFICATION_PREFS } from "@/components/parametres/NotificationsCard"
import LanguageCard from "@/components/parametres/LanguageCard"
import PrivacyCard from "@/components/parametres/PrivacyCard"
import styles from "./page.module.css"

export default function FormateurParametresPage() {
    return (
        <div className={styles.page}>
            <PageHeader title="Paramètres" subtitle="Gérez vos préférences de notifications, de langue et de confidentialité." />

            <NotificationsCard prefs={FORMATEUR_NOTIFICATION_PREFS} />
            <LanguageCard />
            <PrivacyCard />
        </div>
    )
}