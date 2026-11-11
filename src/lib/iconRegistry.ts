import * as solidIcons from "@fortawesome/free-solid-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

/**
 * Icône affichée quand `iconName` est absent ou ne correspond à rien dans
 * le paquet — évite un crash de rendu si une donnée (mock ou future API)
 * contient une clé invalide/obsolète.
 */
const FALLBACK_ICON_NAME = "faTag"

function isIconDefinition(value: unknown): value is IconDefinition {
    return (
        typeof value === "object" &&
        value !== null &&
        "iconName" in value &&
        "icon" in value
    )
}

/**
 * Résout un nom d'icône FontAwesome (ex. "faBookOpen", tel que stocké sur
 * une Category) vers son IconDefinition réelle. Permet de piocher dans tout
 * le paquet free-solid-svg-icons depuis de la donnée, sans maintenir une
 * liste fermée d'icônes supportées dans le code.
 */
export function resolveIcon(iconName: string | null | undefined): IconDefinition {
    const key = iconName ?? FALLBACK_ICON_NAME
    const candidate = (solidIcons as unknown as Record<string, unknown>)[key]
    if (isIconDefinition(candidate)) return candidate

    const fallback = (solidIcons as unknown as Record<string, unknown>)[FALLBACK_ICON_NAME]
    if (isIconDefinition(fallback)) return fallback

    // Filet de sécurité ultime si même le fallback nommé était invalide.
    return solidIcons.faQuestion
}
