/**
 * Vue formateur d'un apprenant dans un groupe qu'il gère — pas le même
 * objet que User/Group ; agrège ce qu'un formateur a besoin de voir d'un
 * coup d'œil (dashboard, roster de groupe, détail apprenant), sans devoir
 * recalculer ça depuis la progression brute à chaque fois.
 */
export interface ApprenantSummary {
    userId: string
    fullName: string
    avatarUrl?: string
    groupId: string
    groupName: string
    /** Dénormalisé — évite une résolution id -> slug pour construire un lien vers le groupe */
    groupSlug: string
    progressPercent: number
    lateModuleTitles: string[]
    lastActiveAt: string
    /** Delta de score entre les 2 dernières tentatives complétées, tous modules confondus — positif = amélioration, négatif = déclin, null = pas assez de données */
    scoreTrend: number | null
}
