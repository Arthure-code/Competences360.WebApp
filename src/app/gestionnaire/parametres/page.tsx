import PageHeader from "@/components/ui/PageHeader"
import NotificationsCard, { GESTIONNAIRE_NOTIFICATION_PREFS } from "@/components/parametres/NotificationsCard"
import LanguageCard from "@/components/parametres/LanguageCard"
import PrivacyCard from "@/components/parametres/PrivacyCard"
import styles from "./page.module.css"

export default async function GestionnaireParametresPage() {

    return (
        <div className={styles.page}>
            <PageHeader title="Paramètres" subtitle="Gérez l'organisation et vos préférences personnelles." />
            <NotificationsCard prefs={GESTIONNAIRE_NOTIFICATION_PREFS} />
            <LanguageCard />
            <PrivacyCard />
        </div>
    )
}