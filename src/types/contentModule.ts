/**
 * Le module tel qu'affiché dans la grille Contenu — 1 par carte, pas 1 par
 * version. Porte le pointeur vers la version officielle ; les versions
 * elles-mêmes (types/moduleVersion.ts) n'ont plus de notion d'officiel,
 * juste draft/published.
 */
export interface ContentModule {
    id: string
    /**
     * Fixé à la création (titre de la toute première version), jamais
     * recalculé ensuite même si une version ultérieure change son propre
     * titre — source stable pour la grille, les groupes "Partagé", le fil
     * d'Ariane, peu importe quelle version est affichée. Une version
     * garde son propre content.title (ce qui est vraiment publié/édité
     * pour ELLE), mais l'affichage structurel du module utilise celui-ci.
     * Même mécanique que slug ci-dessous.
     */
    title: string
    /**
     * Dérivé du titre de la toute première version, à la création — jamais
     * recalculé même si le titre change ensuite (même logique que Group),
     * pour ne jamais casser un lien déjà partagé/assigné. Voir lib/slug.ts.
     */
    slug: string
    organizationId: string
    /** null = aucune version appliquée — badge "Aucune version appliquée" sur la grille */
    officialVersionId: string | null
    /** Rempli seulement si officialVersionId n'est pas null */
    officializedByUserId?: string
    officializedAt?: string
    /** Trace vers le module global source si ce module a été créé par fork depuis le catalogue — absent si créé de A à Z */
    forkedFromGlobalModuleId?: string
    /**
     * true dès qu'un gestionnaire intervient une première fois (applique
     * OU renvoie en brouillon) — une fois vrai, l'auto-application à la
     * publication s'arrête définitivement pour ce module, même si
     * officialVersionId redevient null plus tard. Tant que c'est
     * absent/false, chaque nouvelle publication devient automatiquement
     * la version officielle (v1, v2, v3... peu importe combien) — sinon
     * "publié mais aucune version appliquée" est déroutant pour un
     * formateur qui vient de créer/publier son propre contenu tout neuf.
     */
    hasBeenReviewedByGestionnaire?: boolean

    /**
     * Absent/null = module actif normal. Une fois
     * posé, le module est récupérable pendant TRASH_RETENTION_DAYS
     * (lib/contentTrash.ts) avant purge automatique — même patron que la
     * fenêtre de rétention déjà utilisée pour la progression apprenant
     * (GroupMembership.leftAt, lib/dataRetention.ts), pas une mécanique
     * différente réinventée pour l'occasion.
     */
    trashedAt?: string | null
    /** Qui a mis ce module à la corbeille — dénormalisé, pour l'affichage ("Mis à la corbeille par X") sans lookup supplémentaire */
    trashedByUserId?: string
}