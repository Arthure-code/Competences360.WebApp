import { getCurrentSession } from "@/_mocks/users.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { getFullName } from "@/lib/user"
import CreateGroupForm from "@/components/shared/CreateGroupForm"
import type { GroupContactRole } from "@/types/group"

/**
 * Contrairement au formateur (toujours son propre contact), le
 * gestionnaire choisit qui devient le contact du groupe — n'importe quel
 * formateur de l'org, potentiellement lui-même s'il cumule aussi ce rôle.
 * Filtré aux membres ayant "formateur" dans leurs rôles (voir
 * organizationMembers.mock.ts) — un pur apprenant ne peut jamais être
 * contact d'un groupe (types/group.ts, GroupContactRole).
 */
export default async function GestionnaireCreateGroupPage() {
    const { user, gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const members = await getOrganizationMembers(organizationId)
    const availableContacts = members
        .filter((m) => m.roles.includes("formateur"))
        .map((m) => ({
            id: m.id,
            fullName: m.fullName,
            email: m.email,
            roles: m.roles.filter((r): r is GroupContactRole => r !== "apprenant"),
        }))

    return (
        <CreateGroupForm
            userId={user.id}
            userFullName={getFullName(user)}
            userEmail={user.email}
            userRoles={user.roles.filter((role): role is GroupContactRole => role !== "apprenant")}
            organizationId={organizationId}
            role="gestionnaire"
            availableContacts={availableContacts}
        />
    )
}