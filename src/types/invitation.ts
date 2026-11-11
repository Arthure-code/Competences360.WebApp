import type { Role } from "@/constants/roles"

export type InvitationStatus = "pending" | "accepted" | "expired"

export interface Invitation {
    id: string
    /** Jeton unique de la route /inscription/invitation/[token] — valide le lien, pas juste l'email */
    token: string
    email: string
    /**
     * Tableau, pas un seul Role — un gestionnaire peut inviter quelqu'un
     * comme formateur ET gestionnaire à la fois (même cumul que User.roles,
     * voir types/user.ts). Toujours un seul élément pour un apprenant
     * (jamais cumulé avec un autre rôle).
     */
    roles: Role[]
    organizationId: string
    /** Groupes auxquels l'apprenant sera automatiquement ajouté à l'acceptation — absent/vide pour formateur/gestionnaire */
    groupIds?: string[]
    status: InvitationStatus
    invitedByUserId: string
    sentAt: string
}