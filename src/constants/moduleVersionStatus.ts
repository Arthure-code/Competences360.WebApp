import type { ModuleVersionStatus } from "@/types/moduleVersion"

/**
 * Seulement 2 valeurs — voir types/moduleVersion.ts. "Officiel" n'est plus
 * un statut ici, c'est dérivé ailleurs (ContentModule.officialVersionId
 * === version.id).
 */
export const VERSION_STATUS_LABELS: Record<ModuleVersionStatus, string> = {
    draft: "Brouillon",
    published: "Publié",
}