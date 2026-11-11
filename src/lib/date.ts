/** "14 juin 2026" — utilisé partout où une date de récompense/évènement est affichée. */
export function formatLongDateLabel(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString("fr-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

/** "14 juin 2026, 15:42" — même base que formatLongDateLabel, avec l'heure en plus, pour un horodatage précis (ex. historique des tentatives, dossier apprenant). */
export function formatLongDateTimeLabel(isoDate: string): string {
    const date = new Date(isoDate)
    const datePart = formatLongDateLabel(isoDate)
    const timePart = date.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
    return `${datePart}, ${timePart}`
}