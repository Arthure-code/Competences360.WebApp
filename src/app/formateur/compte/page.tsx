import PageHeader from "@/components/ui/PageHeader"
import PersonalInfoCard from "@/components/compte/PersonalInfoCard"
import UniqueCodeCard from "@/components/compte/UniqueCodeCard"
import AccountStatusCard from "@/components/compte/AccountStatusCard"
import DangerZoneCard from "@/components/compte/DangerZoneCard"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getAccountDeletionFlow } from "@/lib/accountDeletion"
import { getMyPendingDeletionRequest } from "@/_mocks/accountDeletionRequests.mock"
import { getMonTelephone } from "@/_mocks/profil.mock"
import { getFullName } from "@/lib/user"
import type { Role } from "@/constants/roles"
import styles from "./page.module.css"

/**
 * Identique à apprenant/compte/page.tsx — tous les blocs sont déjà
 * agnostiques au rôle (pilotés par les profils présents sur la session,
 * pas par un rôle codé en dur). UniqueCodeCard ne s'affiche de toute façon
 * que si apprenantProfile existe, donc rien à conditionner de plus ici.
 */
export default async function FormateurComptePage() {
    const session = await getCurrentSession()
    const [flow, pendingRequest, telephone] = await Promise.all([
        getAccountDeletionFlow(session),
        getMyPendingDeletionRequest(session.user.id),
        getMonTelephone(),
    ])

    const primaryRole: Role = session.gestionnaireProfile
        ? "gestionnaire"
        : session.formateurProfile
          ? "formateur"
          : "apprenant"

    const organizationId = session.gestionnaireProfile?.organizationId ?? session.formateurProfile?.organizationId

    return (
        <div className={styles.page}>
            <PageHeader
                title="Mon compte"
                subtitle="Gérez vos informations personnelles et vos identifiants de connexion."
            />

            <PersonalInfoCard user={session.user} telephone={telephone} />

            <div className={styles.twoColumnRow}>
                {session.apprenantProfile && <UniqueCodeCard code={session.apprenantProfile.uniqueCode} />}
                <AccountStatusCard session={session} />
            </div>

            <DangerZoneCard
                flow={flow}
                pendingRequest={pendingRequest}
                userId={session.user.id}
                userFullName={getFullName(session.user)}
                role={primaryRole}
                organizationId={organizationId}
            />
        </div>
    )
}