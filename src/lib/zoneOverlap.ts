export interface ZoneRect {
    x: number
    y: number
    width: number
    height: number
}

/**
 * Détecte un chevauchement entre deux zones rectangulaires exprimées en
 * pourcentage — même repère que ZoneCliquableRenderer (x/y = coin
 * supérieur gauche, width/height = dimensions).
 *
 * Destiné à l'outil de création de zones : appeler cette fonction à
 * chaque ajout ou déplacement de zone pour bloquer ou avertir en cas de
 * chevauchement, plutôt que de le découvrir une fois l'exercice publié —
 * le renderer lui-même n'a pas à s'en soucier, il affiche des zones déjà
 * validées à la création.
 */
export function zonesOverlap(a: ZoneRect, b: ZoneRect): boolean {
    const aRight = a.x + a.width
    const aBottom = a.y + a.height
    const bRight = b.x + b.width
    const bBottom = b.y + b.height

    return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y
}

/**
 * Retourne les paires de zones en conflit, avec leur index dans le tableau
 * d'origine — utile pour surligner précisément les zones fautives dans
 * l'outil de création plutôt que de simplement bloquer sans dire lesquelles.
 */
export function findOverlappingZones(zones: ZoneRect[]): Array<[number, number]> {
    const conflicts: Array<[number, number]> = []
    for (let i = 0; i < zones.length; i++) {
        for (let j = i + 1; j < zones.length; j++) {
            if (zonesOverlap(zones[i], zones[j])) conflicts.push([i, j])
        }
    }
    return conflicts
}