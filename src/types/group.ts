import type { Role } from "@/constants/roles"

/**
 * Rôles que la personne-contact d'un groupe peut porter. Dérivé du Role
 * canonique (constants/roles.ts) plutôt que redéfini : un contact de
 * groupe est toujours au moins formateur, parfois aussi gestionnaire —
 * les deux seuls rôles cumulables sur un même compte. On exclut
 * "apprenant" puisqu'un apprenant n'est jamais le contact d'un groupe.
 */
export type GroupContactRole = Exclude<Role, "apprenant">

export interface GroupContact {
    id: string
    fullName: string
    email: string
    roles: GroupContactRole[]
}

export interface Group {
    id: string
    /** Dérivé du nom à la création — utilisé dans l'URL /groupes/[slug], jamais recalculé */
    slug: string
    name: string
    /** Id d'une Organization (types/organization.ts) — résolution par lookup, jamais une string libre */
    organizationId: string
    /** Code court partagé aux apprenants pour rejoindre en libre-service (voir JoinGroupForm/GroupCodeInput côté apprenant) — généré à la création, unique */
    joinCode: string
    contact: GroupContact
    averageProgressPercent: number
    /**
     * Ni memberCount ni la liste des membres ne vivent ici : voir
     * GroupMembership ci-dessous + lib/groups.ts (getMemberCount,
     * getMemberIds) — une seule source de vérité pour "qui est dans quel
     * groupe", dérivable pour l'apprenant comme pour le formateur/gestionnaire.
     *
     * Pareil pour les modules assignés à ce groupe : jamais stockés ici
     * (l'ancien champ moduleIds a été retiré), toujours dérivés via
     * Assignment (voir getAssignedModulesForGroup, lib/assignedModules.ts)
     * — la vraie source de vérité pour "qu'est-ce qui est assigné à ce
     * groupe" est l'assignation elle-même, pas une liste dupliquée ici.
     */
}

/**
 * Table de jonction apprenant <-> groupe. Remplace un éventuel
 * `groupIds: string[]` sur ApprenantProfile : stocker la relation une
 * seule fois ici plutôt que sur les deux entités évite toute
 * désynchronisation.
 */
export interface GroupMembership {
    groupId: string
    userId: string
    joinedAt: string
    /**
     * Départ volontaire (voir removeGroupMembership,
     * groupMemberships.actions.ts), jamais supprimé immédiatement, un
     * départ silencieux préserverait moins bien la fenêtre de rétention
     * (voir lib/dataRetention.ts) que garder une trace explicite du
     * moment du départ, à partir duquel la fenêtre se calcule.
     */
    leftAt?: string | null
}