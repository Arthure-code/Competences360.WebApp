export interface Deadline {
    id: string
    moduleTitle: string
    categoryId: string
    /** Date ISO */
    dueDate: string
    assignedByUserId: string
    /** Dénormalisé pour affichage direct sans lookup supplémentaire dans la liste */
    assignedByName: string
    /** "Commencer" / "Continuer" / "Réviser" — dépend du statut du module */
    actionLabel: string
    href: string
}
