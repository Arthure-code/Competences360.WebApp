/**
 * Convertit un texte libre (titre choisi par un formateur/une org) en slug
 * URL-safe : minuscules, sans accents, espaces/caractères spéciaux remplacés
 * par des tirets. Ne garantit pas l'unicité à lui seul — voir
 * `generateUniqueSlug` pour ça.
 */
export function slugify(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // retire les accents
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/**
 * Génère un slug unique parmi `existingSlugs` : si le slug de base existe
 * déjà, ajoute -2, -3, etc. jusqu'à trouver une valeur libre.
 *
 * À appeler UNE SEULE FOIS, à la création du contenu (module, niveau...).
 * Ne jamais recalculer après coup : renommer le titre plus tard ne doit pas
 * changer l'URL d'un contenu déjà publié/partagé.
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
    const base = slugify(title)
    if (!existingSlugs.includes(base)) return base

    let counter = 2
    let candidate = `${base}-${counter}`
    while (existingSlugs.includes(candidate)) {
        counter++
        candidate = `${base}-${counter}`
    }
    return candidate
}
