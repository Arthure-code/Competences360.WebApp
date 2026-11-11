import AppShell from "@/components/layout/AppShell"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getMyNotifications } from "@/_mocks/notifications.mock"

/**
 * Même schéma que apprenant/layout.tsx et formateur/layout.tsx : fetch
 * session + notifications ici (Server Component), passés en props à
 * AppShell (client).
 *
 * getCurrentSession() lit le cookie "dev-session-key" posé par
 * DevSessionSwitcher — bascule sur la clé "formateurGestionnaire"
 * (usr-marie-roy, seul compte de test avec gestionnaireProfile) pour
 * voir de vraies données ici plutôt que le repli par défaut sur
 * l'apprenant mock.
 */
export default async function GestionnaireLayout({ children }: { children: React.ReactNode }) {
    const { user, gestionnaireProfile } = await getCurrentSession()
    const notifications = await getMyNotifications(user.id)

    return (
        <AppShell
            role="gestionnaire"
            user={user}
            notifications={notifications}
            organizationId={gestionnaireProfile?.organizationId}
        >
            {children}
        </AppShell>
    )
}