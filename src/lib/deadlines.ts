export type DeadlineUrgency = "urgent" | "soon" | "normal"

/** urgent = échéance <= 1 jour, soon = <= 3 jours, normal = au-delà — pilote la couleur (même vocabulaire que Notice : error/warning/neutre) */
export function getDeadlineUrgency(dueDate: string): DeadlineUrgency {
    const diffDays = (new Date(dueDate).getTime() - Date.now()) / 86_400_000
    if (diffDays <= 1) return "urgent"
    if (diffDays <= 3) return "soon"
    return "normal"
}

/** "Dans 10 min" / "Dans 3 h" / "Dans 4 jours" / "En retard" */
export function formatRelativeDeadlineLabel(dueDate: string): string {
    const diffMs = new Date(dueDate).getTime() - Date.now()
    if (diffMs <= 0) return "En retard"

    const diffMinutes = Math.round(diffMs / 60_000)
    if (diffMinutes < 60) return `Dans ${diffMinutes} min`

    const diffHours = Math.round(diffMs / 3_600_000)
    if (diffHours < 24) return `Dans ${diffHours} h`

    const diffDays = Math.round(diffMs / 86_400_000)
    return `Dans ${diffDays} jour${diffDays > 1 ? "s" : ""}`
}

/** "Aujourd'hui, 16:30" si le jour même, sinon "12 octobre 2026" */
export function formatDeadlineDateLabel(dueDate: string): string {
    const date = new Date(dueDate)
    const isToday = date.toDateString() === new Date().toDateString()

    if (isToday) {
        return `Aujourd'hui, ${date.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}`
    }
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })
}
