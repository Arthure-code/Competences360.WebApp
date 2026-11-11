/**
 * Ce qui reste d'une progression après la fenêtre de rétention (voir
 * lib/dataRetention.ts), volontairement un type DIFFÉRENT de
 * ApprenantSummary, pas juste "ApprenantSummary avec userId vide" — un
 * champ optionnel resterait un renseignement personnel aux yeux de la loi
 * tant que la possibilité de le remplir existe, un type séparé qui ne
 * PEUT PAS porter d'identité est la seule vraie garantie d'anonymisation.
 */
export interface AnonymizedProgressEntry {
    id: string
    groupId: string
    /** Mois de l'événement, pas la date précise, une granularité plus fine combinée à d'autres champs pourrait ré-identifier quelqu'un dans un petit groupe */
    month: string
    progressPercent: number
}
