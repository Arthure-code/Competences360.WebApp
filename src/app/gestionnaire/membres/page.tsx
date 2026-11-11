import { Suspense } from "react"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { getInvitationsForOrganization } from "@/_mocks/invitations.mock"
import { getGroupsForOrganization } from "@/_mocks/groups.mock"
import MembresView from "@/app/gestionnaire/_components/membres/MembresView"
import styles from "./page.module.css"

/**
 * Server Component : fetch uniquement — annuaire complet de l'org
 * (getOrganizationMembers, voir organizationMembers.mock.ts pour le
 * détail de comment il est assemblé) + invitations en attente, en 2
 * onglets côté client (MembresView).
 */
export default async function GestionnaireMembresPage() {
    const { user, gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const [members, invitations, groups] = await Promise.all([
        getOrganizationMembers(organizationId),
        getInvitationsForOrganization(organizationId),
        getGroupsForOrganization(organizationId),
    ])

    return (
        <div className={styles.pageWrapper}>
            <Suspense fallback={null}>
                <MembresView
                    members={members}
                    invitations={invitations}
                    groups={groups.map((g) => ({ id: g.id, name: g.name }))}
                    organizationId={organizationId}
                    userId={user.id}
                />
            </Suspense>
        </div>
    )
}