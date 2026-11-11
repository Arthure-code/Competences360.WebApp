import { generateSafeCode } from "@/lib/codeGenerator"
import { slugify } from "@/lib/slug"

/**
 * Code de jonction, même format que l'identifiant unique de l'apprenant
 * (voir lib/codeGenerator.ts) : XXXX-XXXX, sans caractères ambigus.
 */
export function generateJoinCode(): string {
    return generateSafeCode()
}

/**
 * Dérive un slug d'URL à partir du nom du groupe, suffixe court pour
 * éviter les collisions entre deux groupes au même nom. Réutilise
 * slugify() (lib/slug.ts) pour la normalisation elle-même (accents,
 * espaces, minuscules) — auparavant réimplémentée ici en double. Stratégie
 * d'unicité différente de generateUniqueSlug (lib/slug.ts) volontairement
 * : un suffixe horodaté plutôt qu'une vérification contre une liste de
 * slugs existants, pas besoin de connaître tous les slugs de groupe déjà
 * pris au moment de la création.
 */
export function slugifyGroupName(name: string): string {
    const base = slugify(name)
    const suffix = Date.now().toString(36).slice(-4)
    return `${base}-${suffix}`
}