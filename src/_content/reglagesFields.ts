import type { PlatformConfiguration } from "@/types/configuration"

export interface ReglagesFieldDef {
    key: keyof PlatformConfiguration
    label: string
    hint: string
    step?: number
    min?: number
    max?: number
}

/**
 * Sorti de ReglagesView.tsx — pas de logique ici, seulement de la
 * donnée. Répond au même principe qu'ailleurs dans le projet (voir
 * FAQ_ITEMS) : un composant de rendu ne devrait jamais porter une liste
 * de contenu figée en dur dans son propre fichier, plus facile à
 * retrouver/modifier séparément.
 */
export const REGLAGES_FIELDS: ReglagesFieldDef[] = [
    { key: "joursCorbeilleContenu", label: "Rétention de la corbeille (jours)", hint: "Un module mis à la corbeille est supprimé définitivement après ce nombre de jours." },
    { key: "joursAvantAnonymisationCompte", label: "Délai avant anonymisation d'un compte (jours)", hint: "Après une suppression de compte, délai avant que les données personnelles soient anonymisées." },
    { key: "joursAvantPurgeAdhesion", label: "Délai avant purge d'une adhésion (jours)", hint: "Délai avant qu'une adhésion à un groupe inactive soit purgée définitivement." },
    { key: "maxVersionsParModule", label: "Nombre maximum de versions par module", hint: "Au-delà, les versions les plus anciennes ne sont plus accessibles." },
    { key: "seuilAvertissementVersions", label: "Seuil d'avertissement de versions", hint: "Affiche un avertissement quand un module approche le nombre maximum de versions." },
    { key: "seuilReussiteNiveauPourcent", label: "Seuil de réussite d'une activité (%)", hint: "Score minimum, en pourcentage, pour qu'une activité soit considérée réussie.", min: 0, max: 100 },
    { key: "joursInactivite", label: "Seuil d'inactivité (jours)", hint: "Un groupe/apprenant sans activité depuis ce nombre de jours est signalé comme stagnant." },
    { key: "pointsExerciceReussi", label: "Points — exercice réussi", hint: "Points accordés pour un exercice complètement réussi.", step: 0.25 },
    { key: "pointsExercicePartiel", label: "Points — exercice partiel", hint: "Points accordés pour un exercice partiellement réussi.", step: 0.25 },
]