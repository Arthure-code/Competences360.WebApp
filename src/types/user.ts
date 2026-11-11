import type { Role } from "@/constants/roles"

/**
 * Identité commune à tous les rôles. `roles` est un tableau (pas un seul
 * Role) pour représenter le cumul formateur+gestionnaire — un apprenant
 * n'a jamais qu'un seul rôle dans ce tableau (["apprenant"]), les deux
 * autres peuvent cumuler.
 *
 * firstName/lastName séparés (pas de fullName combiné) : le wireframe Mon
 * compte édite les deux indépendamment — voir lib/user.ts pour dériver un
 * nom complet à l'affichage sans dupliquer la donnée.
 */
export interface User {
    id: string
    firstName: string
    lastName: string
    /** Facultatif, affiché dans l'app à la place de firstName si renseigné */
    preferredFirstName?: string
    email: string
    roles: Role[]
    notificationCount: number
    /** Absent = Avatar retombe sur les initiales */
    avatarUrl?: string
}

/**
 * Profil mince : uniquement ce qui n'est dérivable d'aucune autre table.
 * Les groupes d'un apprenant/formateur ne sont PAS stockés ici — voir
 * lib/groups.ts (dérivés de GroupMembership / Group.contact).
 */
export interface ApprenantProfile {
    userId: string
    uniqueCode: string
}

export interface FormateurProfile {
    userId: string
    organizationId: string
    /**
     * Vrais faits bruts, jamais dérivables d'ailleurs — contrairement à
     * "ses groupes gérés" ou "son contenu créé", qui doivent rester
     * calculés par lookup (Group.contact.id, ContentModule.createdByUserId),
     * jamais dupliqués ici (voir la discussion sur l'audit des données,
     * épopée 2 vs épopée 3). Tous optionnels : un profil existant avant
     * l'ajout de ces champs ne les a pas nécessairement renseignés.
     */
    hiredAt?: string
    bio?: string
}

export interface GestionnaireProfile {
    userId: string
    organizationId: string
}

/**
 * Point d'entrée unique "qui est connecté et avec quelles données de
 * rôle" — chaque page ne lit que le profil qui la concerne, sans
 * roles.includes(...) dispersés dans l'UI.
 */
export interface UserSession {
    user: User
    apprenantProfile?: ApprenantProfile
    formateurProfile?: FormateurProfile
    gestionnaireProfile?: GestionnaireProfile
}