import type { UserSession } from "@/types/user"
import { getMyGroups, getMyManagedGroups, getGroupMemberCount } from "@/_mocks/groups.mock"
import { getOrganizationManagerCount } from "@/_mocks/users.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"

export type AccountDeletionFlow =
    | { kind: "immediate"; title: string; message: string; confirmLabel: string; cancelLabel: string }
    | { kind: "request"; title: string; message: string; confirmLabel: string; cancelLabel: string }
    | { kind: "blocked"; title: string; message: string }

const GENERIC_IMMEDIATE_MESSAGE =
    "Vous allez supprimer votre compte. Cette action est irréversible. Toutes vos données, y compris vos modules complétés et vos récompenses, seront définitivement supprimées de nos serveurs."

/**
 * Détermine le parcours de suppression selon le(s) profil(s) actifs sur la
 * session. Priorité au gestionnaire — le plus lourd de conséquences (perte
 * d'accès à toute une organisation) — si le compte cumule
 * formateur+gestionnaire. Hypothèse non confirmée par wireframe : aucune
 * maquette ne couvre ce cas combiné.
 */
export async function getAccountDeletionFlow(session: UserSession): Promise<AccountDeletionFlow> {
    if (session.gestionnaireProfile) {
        const organizationId = session.gestionnaireProfile.organizationId
        const [managerCount, organization] = await Promise.all([
            getOrganizationManagerCount(organizationId),
            getOrganizationById(organizationId),
        ])

        if (managerCount <= 1) {
            return {
                kind: "blocked",
                title: "Action impossible",
                message:
                    "Vous êtes le seul gestionnaire de votre organisation. Pour supprimer votre compte, vous devez d'abord inviter un autre gestionnaire qui se créera un compte pour prendre la relève ou nommer un gestionnaire parmis les formateurs.",
            }
        }

        return {
            kind: "immediate",
            title: "Confirmer la suppression",
            message: `Vous êtes gestionnaire de ${
                organization?.name ?? "votre organisation"
            }. En supprimant votre compte, vous perdrez l'accès à l'organisation et à toutes ses données. Les autres gestionnaires continueront de gérer l'organisation normalement.`,
            confirmLabel: "Oui, supprimez-le!",
            cancelLabel: "Non, gardez-le.",
        }
    }

    if (session.formateurProfile) {
        const managedGroups = await getMyManagedGroups(session.formateurProfile.userId)
        const memberCounts = await Promise.all(managedGroups.map((group) => getGroupMemberCount(group.id)))
        const hasActiveApprenants = memberCounts.some((count) => count > 0)

        if (hasActiveApprenants) {
            return {
                kind: "request",
                title: "Supprimer votre compte",
                message:
                    "Vous êtes formateur au sein d'une organisation et gérez des apprenants actifs. Une demande sera envoyée à votre gestionnaire. Votre compte sera supprimé une fois vos apprenants réassignés et la demande approuvée.",
                confirmLabel: "Envoyer la demande!",
                cancelLabel: "Annuler",
            }
        }

        // Pas de wireframe pour ce cas (formateur sans apprenant actif) —
        // retombe sur le texte générique de suppression immédiate, comme
        // un apprenant sans groupe.
        return {
            kind: "immediate",
            title: "Confirmer la suppression",
            message: GENERIC_IMMEDIATE_MESSAGE,
            confirmLabel: "Oui, supprimez-le!",
            cancelLabel: "Non, gardez-le.",
        }
    }

    if (session.apprenantProfile) {
        const groups = await getMyGroups(session.apprenantProfile.userId)

        if (groups.length > 0) {
            return {
                kind: "request",
                title: "Supprimer votre compte",
                message:
                    "Vous êtes lié à un ou plusieurs groupes. Une demande de suppression sera envoyée à votre organisation. Votre compte sera supprimé lorsqu'un gestionnaire l'aura approuvée. Pendant ce temps, votre compte demeure actif.",
                confirmLabel: "Envoyer la demande!",
                cancelLabel: "Annuler",
            }
        }

        return {
            kind: "immediate",
            title: "Confirmer la suppression",
            message: GENERIC_IMMEDIATE_MESSAGE,
            confirmLabel: "Oui, supprimez-le!",
            cancelLabel: "Non, gardez-le.",
        }
    }

    // Repli — ne devrait pas arriver (un compte a toujours au moins un profil)
    return {
        kind: "immediate",
        title: "Confirmer la suppression",
        message: GENERIC_IMMEDIATE_MESSAGE,
        confirmLabel: "Oui, supprimez-le!",
        cancelLabel: "Non, gardez-le.",
    }
}
