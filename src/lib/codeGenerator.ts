/**
 * Caractères alphanumériques majuscules, sans caractères ambigus au
 * clavier/à l'oral (0/O, 1/I/L exclus) — un code peut être reçu à l'oral
 * ou écrit à la main avant d'être tapé. Source unique, réutilisée
 * partout où un code du même genre est généré (code de jonction de
 * groupe, identifiant unique apprenant), pour ne jamais avoir 2 formats
 * différents qui se ressemblent sans être cohérents.
 */
const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

/**
 * Format XXXX-XXXX (2 groupes de 4, séparés d'un tiret) — plus lisible
 * et plus facile à dicter/retaper qu'une suite plate de caractères, le
 * même format que l'identifiant unique de l'apprenant (voir
 * apprenantProfile.uniqueCode).
 */
export function generateSafeCode(): string {
    function group(): string {
        let part = ""
        for (let i = 0; i < 4; i++) {
            part += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
        }
        return part
    }
    return `${group()}-${group()}`
}
