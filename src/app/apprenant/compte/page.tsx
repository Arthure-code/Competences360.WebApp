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
 * Non monolithique : chaque bloc est un composant indépendant, rendu
 * conditionnellement selon le profil présent sur la session. Un compte
 * formateur+gestionnaire n'aurait qu'à ajouter ses propres blocs
 * (ex. carte organisation gérée) sans toucher à ceux-ci.
 */
export default async function ComptePage() {
    const session = await getCurrentSession()
    const [flow, pendingRequest, telephone] = await Promise.all([
        getAccountDeletionFlow(session),
        getMyPendingDeletionRequest(session.user.id),
        getMonTelephone(),
    ])

    // Rôle "principal" pour la demande de suppression — même priorité que
    // getAccountDeletionFlow (gestionnaire > formateur > apprenant).
    const primaryRole: Role = session.gestionnaireProfile
        ? "gestionnaire"
        : session.formateurProfile
          ? "formateur"
          : "apprenant"

    // Absent pour un apprenant pur — voir la note sur AccountDeletionRequest.organizationId
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