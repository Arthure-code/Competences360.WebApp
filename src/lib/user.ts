import type { User } from "@/types/user"

/** Nom complet dérivé — jamais stocké séparément, pour ne jamais désynchroniser d'un renommage. */
export function getFullName(user: Pick<User, "firstName" | "lastName">): string {
    return `${user.firstName} ${user.lastName}`
}

/** "ML" — pour l'avatar. */
export function getInitials(user: Pick<User, "firstName" | "lastName">): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
}

/** Prénom affiché dans l'app — le préféré s'il est renseigné, sinon le prénom légal. */
export function getDisplayFirstName(user: Pick<User, "firstName" | "preferredFirstName">): string {
    return user.preferredFirstName || user.firstName
}