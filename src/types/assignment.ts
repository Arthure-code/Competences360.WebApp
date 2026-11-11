export interface Assignment {
    id: string
    targetType: "module" | "niveau"
    targetId: string
    /** Version précise assignée — omis = la version officielle (published) courante du contenu */
    versionId?: string
    assignedTo: { type: "apprenant"; userId: string } | { type: "group"; groupId: string }
    dueDate?: string
    assignedByUserId: string
    assignedAt: string
}
