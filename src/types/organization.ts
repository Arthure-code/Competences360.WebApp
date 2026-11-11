/** Une seule valeur pour l'instant — tout gratuit. Les futures valeurs (ex. "pro", "trial") viendront avec le système d'abonnement v2. */
export type OrganizationSubscriptionStatus = "free"

/**
 * Tranche approximative, pas un compte précis — un compte précis (nombre
 * de membres) se calcule, jamais stocké (voir lib/organizations.ts une
 * fois construit, épopée 3). Cette tranche, elle, est une vraie donnée
 * saisie par l'org elle-même à l'inscription, pas dérivable d'ailleurs.
 */
export type OrganizationSizeRange = "1-10" | "11-50" | "51-200" | "201-500" | "500+"

export interface Organization {
    id: string
    name: string
    subscriptionStatus: OrganizationSubscriptionStatus
    /**
     * Volontairement pas de champ "membres"/"formateurs" ici — se dérive
     * par lookup (FormateurProfile/GestionnaireProfile filtrés par
     * organizationId), même principe que partout ailleurs dans le
     * projet : jamais de duplication de relation, toujours résolue par id.
     */

    /**
     * Vrais faits bruts, jamais dérivables d'ailleurs dans le système —
     * contrairement aux comptes/agrégats (nombre de membres, etc.), qui
     * doivent rester calculés, pas stockés ici (voir la discussion sur
     * l'audit des données, épopée 2 vs épopée 3). Tous optionnels : une
     * org existante avant l'ajout de ces champs ne les a pas
     * nécessairement renseignés.
     */
    address?: string
    city?: string
    province?: string
    postalCode?: string
    sector?: string
    sizeRange?: OrganizationSizeRange
    phone?: string
       /**
     * ⚠️ Absent du type original envoyé — ajouté en optionnel sur ta
     * demande. Vérifier avec le backend si ce champ existe déjà côté API
     * sous un autre nom, ou s'il faut aussi l'ajouter là-bas.
     */
    email?: string
    website?: string
    logoUrl?: string
    /** Date de création réelle de l'organisation dans le système, distincte de la 1ère assignation ou du 1er groupe créé — optionnel : organizations.mock.ts n'est pas vérifié dans cette session, je ne veux pas risquer de casser la compilation en devinant qu'il le fournit déjà */
    createdAt?: string
    /**
     * ⚠️ CHAMP MANQUANT CÔTÉ BACKEND — n'existe pas encore sur
     * organizations.actions.ts (aucune route pour l'activer/désactiver).
     * Optionnel ici pour ne rien casser tant que le backend ne le renvoie
     * pas — undefined traité comme true (actif) partout où c'est lu. Une
     * fois le backend prêt : retirer le "?" et le "| undefined" implicite,
     * documenter la vraie sémantique côté backend.
     */
    isActive?: boolean
}