export interface MomentFortDefinition {
    key: string
    label: string
    description: string
    /** Nom d'icône FontAwesome (lib/icon-registry.ts) */
    icon: string
}

/**
 * Registre central des moments forts possibles. Ajouter une entrée ici
 * suffit pour qu'un nouveau type de moment fort soit affichable — la
 * détection (quand l'attribuer) vit dans apprenantModuleProgress.actions.ts
 * (voir upsertNiveauProgress) pour premier-pas/score-parfait/perseverance/
 * serie-reussites/retour-apres-pause, ou dérivée à l'affichage
 * (ReussitesView) pour module-parfait/rattrapage-reussi — mais la
 * définition (libellé, description, icône) reste unique et centralisée
 * ici, jamais dupliquée à chaque endroit qui l'affiche.
 *
 * Pour ajouter un nouveau moment fort : une nouvelle clé ici, rien d'autre
 * à toucher pour que Mes réussites et les notifications sachent l'afficher.
 */
export const MOMENTS_FORTS: Record<string, MomentFortDefinition> = {
    "premier-pas": {
        key: "premier-pas",
        label: "Premier pas",
        description: "Un excellent début dans votre parcours d'apprentissage.",
        icon: "faShoePrints",
    },
    perseverance: {
        key: "perseverance",
        label: "Persévérance",
        description: "Première réussite après un échec.",
        icon: "faArrowTrendUp",
    },
    "score-parfait": {
        key: "score-parfait",
        label: "Score parfait",
        description: "Maîtrise totale d'un module.",
        icon: "faStar",
    },
    "premier-certificat": {
        key: "premier-certificat",
        label: "Premier certificat",
        description: "Module complété en entier.",
        icon: "faCertificate",
    },
    "serie-reussites": {
        key: "serie-reussites",
        label: "Série de réussites",
        description: "3 activités réussies dès le premier essai, à la suite.",
        icon: "faBolt",
    },
    "module-parfait": {
        key: "module-parfait",
        label: "Module parfait",
        description: "Chaque activité de ce module réussie avec un score parfait.",
        icon: "faTrophy",
    },
    "retour-apres-pause": {
        key: "retour-apres-pause",
        label: "De retour",
        description: "De retour après une pause, prêt à continuer.",
        icon: "faSun",
    },
    "rattrapage-reussi": {
        key: "rattrapage-reussi",
        label: "Rattrapage réussi",
        description: "Module complété malgré une échéance dépassée.",
        icon: "faFlagCheckered",
    },
}

/** Repli neutre si une clé de moment fort inconnue/obsolète est rencontrée, plutôt qu'un crash de rendu. */
export function getMomentFortDefinition(key: string): MomentFortDefinition {
    return (
        MOMENTS_FORTS[key] ?? {
            key,
            label: "Moment fort",
            description: "",
            icon: "faStar",
        }
    )
}
