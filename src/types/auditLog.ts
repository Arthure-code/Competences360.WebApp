/**
 * 
 *
 * Immuable par nature — jamais de updateAuditEntry ni deleteAuditEntry,
 * un journal qu'on peut modifier ne sert plus à rien comme preuve.
 */

export type AuditActionType =
    | "organisation_desactivee"
    | "organisation_reactivee"
    | "organisation_renommee"
    | "membre_role_modifie"
    | "membre_organisation_corrigee"
    | "categorie_modifiee"
    | "categorie_supprimee"
    | "admin_cree"
    | "admin_desactive"
    | "admin_reactive"
    | "admin_promu_proprietaire"
    | "admin_retrograde"
    | "admin_designe_racine"
    | "configuration_modifiee"
    | "signalement_statut_modifie"
    | "compte_utilisateur_desactive"
    | "compte_utilisateur_reactive"
    /** Admin retire un module du contenu d'une organisation (supervision, pas son propre contenu) — toujours accompagné d'une raison écrite, voir organisationContent.actions.ts */
    | "contenu_mis_a_la_corbeille_par_admin"

export interface AuditLogEntry {
    id: string
    /** L'admin qui a posé le geste */
    actorId: string
    actorName: string
    actionType: AuditActionType
    /** Description déjà formée, prête à afficher — ex. "A désactivé l'organisation Hôtel Boréal" */
    description: string
    /** Id de la cible (org, membre, admin, signalement) — sert le filtre "par cible" */
    targetId?: string
    targetLabel?: string
    /** Route cliquable vers la page de la cible, si elle existe (ex. détail d'une org, détail d'un signalement) — absent si rien à consulter (ex. une config globale sans page dédiée) */
    targetHref?: string
    /** Valeur avant/après — UN SEUL changement (rôle, statut). Pour plusieurs à la fois, voir `changes` ci-dessous plutôt que d'empiler ici. */
    before?: string
    after?: string
    /**
     * Plusieurs changements à la fois (ex. plusieurs réglages modifiés en
     * un seul enregistrement) — affiché en liste, pas empilé dans
     * `description` en une seule phrase à rallonge. `before`/`after`
     * ci-dessus restent pour le cas simple à une seule valeur.
     */
    changes?: { label: string; before: string; after: string }[]
    createdAt: string
}

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
    organisation_desactivee: "Organisation désactivée",
    organisation_reactivee: "Organisation réactivée",
    organisation_renommee: "Organisation renommée",
    membre_role_modifie: "Rôle de membre modifié",
    membre_organisation_corrigee: "Affiliation de membre corrigée",
    categorie_modifiee: "Catégorie modifiée",
    categorie_supprimee: "Catégorie supprimée",
    admin_cree: "Administrateur créé",
    admin_desactive: "Administrateur désactivé",
    admin_reactive: "Administrateur réactivé",
    admin_promu_proprietaire: "Administrateur promu propriétaire",
    admin_retrograde: "Administrateur rétrogradé",
    admin_designe_racine: "Compte racine désigné",
    configuration_modifiee: "Réglages modifiés",
    signalement_statut_modifie: "Statut de signalement modifié",
    compte_utilisateur_desactive: "Compte utilisateur désactivé",
    compte_utilisateur_reactive: "Compte utilisateur réactivé",
    contenu_mis_a_la_corbeille_par_admin: "Contenu retiré par supervision",
}