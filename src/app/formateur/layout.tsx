import AppShell from "@/components/layout/AppShell"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getMyNotifications } from "@/_mocks/notifications.mock"

/**
 * Même schéma que apprenant/layout.tsx : fetch session + notifications ici
 * (Server Component), passés en props à AppShell (client).
 *
 * getCurrentSession() lit le cookie "dev-session-key" posé par
 * DevSessionSwitcher — retombe sur "apprenant" par défaut si absent.
 * Pour tester cet espace, basculer sur la clé "formateur" ou
 * "formateurGestionnaire" via le sélecteur.
 */
export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
    const { user, formateurProfile } = await getCurrentSession()
    const notifications = await getMyNotifications(user.id)

    return (
        <AppShell role="formateur" user={user} notifications={notifications} organizationId={formateurProfile?.organizationId}>
            {children}
        </AppShell>
    )
}