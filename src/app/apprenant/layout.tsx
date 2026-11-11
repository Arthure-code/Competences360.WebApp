import AppShell from "@/components/layout/AppShell"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getMyNotifications } from "@/_mocks/notifications.mock"

export default async function ApprenantLayout({ children }: { children: React.ReactNode }) {
    const { user } = await getCurrentSession()
    const notifications = await getMyNotifications(user.id)

    return (
        <AppShell role="apprenant" user={user} notifications={notifications}>
            {children}
        </AppShell>
    )
}