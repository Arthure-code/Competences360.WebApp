import type { UserSession } from "@/types/user"
import { getOrganizationById } from "@/_mocks/organizations.mock"

export interface AccountStatusEntry {
    roleLabel: string
    description: string
}

/**
 * Une entrée par profil actif sur la session — additif, pas exclusif :
 * un compte formateur+gestionnaire affiche les DEUX entrées empilées,
 * jamais une troisième "rôle combiné" fabriquée de toutes pièces.
 */
export async function getAccountStatusEntries(session: UserSession): Promise<AccountStatusEntry[]> {
    const entries: AccountStatusEntry[] = []

    if (session.apprenantProfile) {
        entries.push({
            roleLabel: "Apprenant en formation",
            description:
                "Vous êtes lié à une ou plusieurs organisations via vos groupes. Vos formateurs peuvent vous assigner des modules et suivre votre progression.",
        })
    }

    if (session.formateurProfile) {
        const organization = await getOrganizationById(session.formateurProfile.organizationId)
        entries.push({
            roleLabel: "Formateur",
            description: `Vous représentez ${
                organization?.name ?? "une organisation"
            } en tant que formateur. Vous pouvez gérer des groupes et suivre la progression de vos apprenants.`,
        })
    }

    if (session.gestionnaireProfile) {
        const organization = await getOrganizationById(session.gestionnaireProfile.organizationId)
        entries.push({
            roleLabel: "Gestionnaire",
            description: `Vous représentez ${
                organization?.name ?? "une organisation"
            } en tant que gestionnaire. Vous pouvez inviter des formateurs et gérer votre organisation.`,
        })
    }

    return entries
}