import PageHeader from "@/components/ui/PageHeader"
import NotificationsCard from "@/components/parametres/NotificationsCard"
import PrivacyCard from "@/components/parametres/PrivacyCard"
import { ADMIN_NOTIFICATION_PREFS } from "@/_content/adminNotificationPrefs"
import styles from "./ParametresView.module.css"

/**
 * NotificationsCard et PrivacyCard (components/parametres/) réutilisés
 * TELS QUELS — tous deux sans dépendance à la session normale
 * (NotificationsCard : state local seulement ; PrivacyCard : liens
 * statiques). ADMIN_NOTIFICATION_PREFS vit à part (_content/), pas ajouté
 * au fichier partagé.
 *
 * LanguageCard (le vrai) volontairement PAS réutilisé — il appelle
 * lireMesPreferences/changerMaLangue (_mocks/preferences.actions.ts), qui
 * résolvent la session normale (apprenant/formateur/gestionnaire), pas la
 * session Admin, complètement séparée. Le réutiliser agirait sur le
 * mauvais compte, ou échouerait silencieusement. De toute façon, une
 * seule langue est actuellement proposée (voir son propre commentaire :
 * "Seul « fr » est proposé... tant que les traductions anglaises
 * n'existent pas") — rien de significatif à offrir ici pour l'instant.
 *
 * Suppression de compte — PAS ici, voir app/admin/compte/page.tsx : même
 * patron que les 3 autres rôles, la "zone de danger" vit dans Mon
 * compte, pas Paramètres.
 */
export default function ParametresView() {
    return (
        <div className={styles.page}>
            <PageHeader title="Paramètres" subtitle="Vos préférences personnelles, en tant qu'administrateur." />
            <NotificationsCard prefs={ADMIN_NOTIFICATION_PREFS} />
            <PrivacyCard />
        </div>
    )
}
