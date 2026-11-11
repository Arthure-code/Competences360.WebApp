import type { ZoneRemplirFieldType } from "@/types/exercise"

/**
 * Un seul endroit qui décide, par type de champ : quel masque afficher,
 * quels caractères sont acceptés, comment la saisie se met en forme
 * AUTOMATIQUEMENT (séparateurs insérés en tapant, pas juste un espace
 * réservé statique), et comment comparer à la bonne réponse. Le
 * formateur choisit un type, jamais de formatage à configurer à la main.
 *
 * Appliqué aux DEUX endroits où une valeur est tapée pour ce type de
 * champ : la saisie de l'apprenant (ZoneRemplirRenderer.tsx) ET la
 * "bonne réponse attendue" de l'éditeur (ZoneRemplirEditablePreview.tsx)
 * — mêmes règles des deux côtés, sinon le formateur pourrait taper une
 * bonne réponse dans un format que l'apprenant ne peut jamais produire.
 */

/** Libellés affichés dans le sélecteur de type, éditeur formateur. */
export const ZONE_REMPLIR_FIELD_LABELS: Record<ZoneRemplirFieldType["kind"], string> = {
    texte_libre: "Texte libre",
    nombre: "Nombre",
    montant: "Montant",
    telephone: "Téléphone",
    code_postal: "Code postal",
    date: "Date",
    courriel: "Courriel",
    gabarit: "Code personnalisé (gabarit)",
}

/**
 * Pattern interne pour les types à LONGUEUR FIXE — même convention que
 * "gabarit" (# = chiffre, A = lettre, tout autre caractère est un
 * séparateur littéral, auto-inséré). null pour les types "libres"
 * (texte_libre, nombre, montant, courriel), dont la longueur n'est pas
 * fixée d'avance.
 */
function getPattern(fieldType: ZoneRemplirFieldType): string | null {
    switch (fieldType.kind) {
        case "telephone":
            return "###-###-####"
        case "code_postal":
            // Format canadien : Lettre-Chiffre-Lettre espace Chiffre-Lettre-Chiffre
            return "A#A #A#"
        case "date":
            return fieldType.format === "aaaa-mm-jj" ? "####-##-##" : "##/##/####"
        case "gabarit":
            return fieldType.pattern
        default:
            return null
    }
}

/** Masque affiché en espace réservé avant toute saisie — dérivé du pattern pour les types à longueur fixe. */
export function getFieldMask(fieldType: ZoneRemplirFieldType): string {
    const pattern = getPattern(fieldType)
    if (pattern !== null) return pattern.replace(/[#A*]/g, "_")

    if (fieldType.kind === "montant") {
        return fieldType.position === "avant" ? `${fieldType.symbole} ` : ` ${fieldType.symbole}`
    }
    return ""
}

/** true si un caractère correspond à la position du pattern à cet index (# = chiffre, A = lettre, * = n'importe quoi). */
function matchesSlot(char: string, slot: string): boolean {
    if (slot === "#") return /\d/.test(char)
    if (slot === "A") return /[a-zA-Z]/.test(char)
    return true // "*"
}

/**
 * Cœur de la mise en forme automatique — prend la saisie BRUTE (incluant
 * ce que l'apprenant vient de taper, séparateurs compris s'il les a tapés
 * lui-même par réflexe) et reconstruit la valeur affichée en insérant les
 * séparateurs du pattern aux bonnes positions, peu importe ce que
 * l'apprenant a tapé exactement — même principe qu'un champ de carte de
 * crédit qui insère les espaces tout seul.
 */
function applyPatternFormatting(pattern: string, rawValue: string): string {
    // Ne garde que les caractères qui pourraient remplir une position du
    // pattern (chiffres/lettres selon le cas) — les séparateurs déjà
    // tapés par réflexe (ex. l'apprenant tape "514-555-1234") sont
    // retirés ici, puis réinsérés au bon endroit juste après.
    const fillableChars = rawValue.split("").filter((char) => /[a-zA-Z0-9]/.test(char))

    let result = ""
    let charIndex = 0
    for (let i = 0; i < pattern.length && charIndex < fillableChars.length; i++) {
        const slot = pattern[i]
        if (slot === "#" || slot === "A" || slot === "*") {
            const char = fillableChars[charIndex]
            if (!matchesSlot(char, slot)) {
                // Caractère qui ne correspond pas au type attendu à cette position (ex. une lettre là où un chiffre est attendu) — ignoré plutôt qu'inséré.
                charIndex++
                i--
                continue
            }
            result += char
            charIndex++
        } else {
            result += slot
        }
    }
    return result
}

/**
 * Point d'entrée unique pour formater une saisie selon le type de champ —
 * utilisé à la fois par l'apprenant (ZoneRemplirRenderer) et par
 * l'éditeur (ZoneRemplirEditablePreview, champ "Bonne réponse attendue")
 * pour que les deux appliquent exactement les mêmes règles.
 */
export function formatZoneRemplirInput(fieldType: ZoneRemplirFieldType, rawValue: string): string {
    const pattern = getPattern(fieldType)
    if (pattern !== null) return applyPatternFormatting(pattern, rawValue)

    switch (fieldType.kind) {
        case "nombre":
        case "montant":
            return rawValue.replace(/[^\d.,]/g, "")
        case "texte_libre":
        case "courriel":
            return rawValue
        default:
            return rawValue
    }
}

/**
 * Nombre de positions saisissables pour un type à longueur fixe (compte
 * des #/A/* du pattern, pas les séparateurs) — la vraie limite de
 * caractères pour ces types, pas besoin que le formateur la compte ou la
 * configure à la main. undefined pour les types "libres", où une limite
 * reste une vraie option utile, configurable séparément.
 */
export function getFixedLength(fieldType: ZoneRemplirFieldType): number | undefined {
    const pattern = getPattern(fieldType)
    if (pattern === null) return undefined
    return pattern.replace(/[^#A*]/g, "").length
}

/**
 * Phrase claire, visible par le formateur (sous le sélecteur de type) ET
 * par l'apprenant (en infobulle sur le champ, attribut title) — pour que
 * taper quelque chose qui disparaît ou ne se valide pas ne passe jamais
 * pour un bug : on explique ce qui est attendu AVANT que ça arrive.
 */
export function getFieldTypeHint(fieldType: ZoneRemplirFieldType): string {
    switch (fieldType.kind) {
        case "texte_libre":
            return "N'importe quel texte."
        case "nombre":
            return "Chiffres seulement."
        case "montant": {
            const symboleTexte = fieldType.position === "avant" ? `${fieldType.symbole} avant` : `${fieldType.symbole} après`
            return `Chiffres seulement — le symbole (${symboleTexte} le nombre) s'affiche automatiquement, ne le tapez pas.`
        }
        case "telephone":
            return "10 chiffres — les tirets s'ajoutent automatiquement en tapant."
        case "code_postal":
            return "Lettre-Chiffre-Lettre Chiffre-Lettre-Chiffre (format canadien) — l'espace s'ajoute automatiquement."
        case "date": {
            const formatTexte = fieldType.format === "aaaa-mm-jj" ? "AAAA-MM-JJ" : fieldType.format === "mm/jj/aaaa" ? "MM/JJ/AAAA" : "JJ/MM/AAAA"
            return `8 chiffres, format ${formatTexte} — les séparateurs s'ajoutent automatiquement en tapant.`
        }
        case "courriel":
            return "Une adresse courriel."
        case "gabarit": {
            const nbChiffres = (fieldType.pattern.match(/#/g) ?? []).length
            const nbLettres = (fieldType.pattern.match(/A/g) ?? []).length
            const parts: string[] = []
            if (nbChiffres > 0) parts.push(`${nbChiffres} chiffre${nbChiffres > 1 ? "s" : ""}`)
            if (nbLettres > 0) parts.push(`${nbLettres} lettre${nbLettres > 1 ? "s" : ""}`)
            const description = parts.length > 0 ? parts.join(" et ") : "caractères"
            return `${description} attendus — les séparateurs du gabarit s'ajoutent automatiquement en tapant.`
        }
    }
}

/** Normalise avant comparaison — espaces/casse/accents ignorés partout. */
function normalizeBase(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
}

/**
 * Type HTML natif de l'input — seul "courriel" en profite vraiment pour
 * l'instant (clavier mobile avec @ facilement accessible). Les autres
 * types restent "text" : un input type="number"/"date" natif imposerait
 * son propre format, en conflit avec notre masque/formatage personnalisé.
 */
export function getNativeInputType(fieldType: ZoneRemplirFieldType): "text" | "email" {
    return fieldType.kind === "courriel" ? "email" : "text"
}

export function isZoneRemplirAnswerCorrect(fieldType: ZoneRemplirFieldType, given: string, expected: string): boolean {
    if (fieldType.kind === "montant") {
        // "1763,97" = "1763.97" = "1 763,97" — virgule et point équivalents, espaces (milliers) ignorés.
        const cleanGiven = normalizeBase(given).replace(/,/g, ".")
        const cleanExpected = normalizeBase(expected).replace(/,/g, ".")
        return parseFloat(cleanGiven) === parseFloat(cleanExpected)
    }

    if (fieldType.kind === "nombre") {
        return parseFloat(normalizeBase(given).replace(/,/g, ".")) === parseFloat(normalizeBase(expected).replace(/,/g, "."))
    }

    return normalizeBase(given) === normalizeBase(expected)
}