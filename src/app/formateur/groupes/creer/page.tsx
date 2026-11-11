import { getCurrentSession } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import CreateGroupForm from "@/components/shared/CreateGroupForm"
import type { GroupContactRole } from "@/types/group"

export default async function CreateGroupPage() {
    const { user, formateurProfile } = await getCurrentSession()

    return (
        <CreateGroupForm
            userId={user.id}
            userFullName={getFullName(user)}
            userEmail={user.email}
            userRoles={user.roles.filter((role): role is GroupContactRole => role !== "apprenant")}
            organizationId={formateurProfile?.organizationId ?? ""}
            role="formateur"
        />
    )
}