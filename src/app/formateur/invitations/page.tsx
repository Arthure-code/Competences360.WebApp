import { getMyManagedGroups } from "@/_mocks/groups.mock"
import { getMySentInvitations } from "@/_mocks/invitations.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import InvitationsView from "@/app/formateur/_components/invitations/InvitationsView"

export default async function FormateurInvitationsPage() {
    const { user, formateurProfile } = await getCurrentSession()
    const [groups, sentInvitations] = await Promise.all([
        getMyManagedGroups(user.id),
        getMySentInvitations(user.id),
    ])

    return (
        <InvitationsView
            groups={groups.map((group) => ({ id: group.id, name: group.name }))}
            sentInvitations={sentInvitations}
            userId={user.id}
            organizationId={formateurProfile?.organizationId ?? ""}
        />
    )
}