import StatusBadge from "@/components/ui/StatusBadge"
import type { ModuleVersion } from "@/types/moduleVersion"

interface VersionStatusBadgeProps {
    version: ModuleVersion
    isOfficial: boolean
    /** Officielle mais jamais confirmée par un gestionnaire (auto-appliquée, voir autoApplyIfNeverReviewed) — prend le dessus sur "Officielle" */
    isPendingReview?: boolean
    className?: string
}

/**
 * Remplace le "(officielle)" discret ajouté en suffixe de texte — un
 * badge visuel cohérent partout où une version est montrée (sélecteur
 * d'assignation, cartes "Partagé", historique de versions, file "À
 * réviser"), plutôt qu'un texte différent réinventé à chaque endroit.
 *
 * Mêmes mots que les onglets (Privé/Partagé/Contenu de l'org/À réviser) —
 * pas "Brouillon"/"Publiée" en vocabulaire séparé. Dans ce système précis,
 * chaque état correspond exactement à un onglet : autant utiliser un seul
 * vocabulaire plutôt que d'en faire apprendre deux pour la même chose.
 */
export default function VersionStatusBadge({
    version,
    isOfficial,
    isPendingReview = false,
    className,
}: VersionStatusBadgeProps) {
    if (isOfficial && isPendingReview) return <StatusBadge variant="warning" label="À réviser" className={className} />
    if (isOfficial) return <StatusBadge variant="success" label="Officielle" className={className} />
    if (version.status === "published") return <StatusBadge variant="info" label="Partagé" className={className} />
    return <StatusBadge variant="neutral" label="Privé" className={className} />
}
