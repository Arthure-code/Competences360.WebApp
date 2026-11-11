import { IconDefinition, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import StatusBadge, { StatusVariant } from "@/components/ui/StatusBadge"

export type AssignmentStatus = "todo" | "in-progress" | "late" | "done"

const STATUS_CONFIG: Record<
    AssignmentStatus,
    { variant: StatusVariant; label: string; icon?: IconDefinition }
> = {
    todo: { variant: "neutral", label: "À faire" },
    "in-progress": { variant: "info", label: "En cours" },
    late: { variant: "danger", label: "En retard"},
    done: { variant: "success", label: "Terminé" },
}

// ex avec icon: late: { variant: "danger", label: "En retard", icon: faTriangleExclamation }, 

interface AssignmentStatusBadgeProps {
    status: AssignmentStatus
    /** Remplace le libellé par défaut si besoin d'un texte plus spécifique */
    label?: string
    className?: string
}

export default function AssignmentStatusBadge({
    status,
    label,
    className = "",
}: AssignmentStatusBadgeProps) {
    const config = STATUS_CONFIG[status]
    return (
        <StatusBadge
            variant={config.variant}
            label={label ?? config.label}
            icon={config.icon}
            className={className}
        />
    )
}