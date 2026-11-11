/**
 * Lien externe rattaché à un module — distinct des Activités (niveaux)
 * et de leurs Exercices : affiché une seule fois pour le module entier,
 * pas répété par activité. Juste un titre + une URL, aucune mécanique de
 * correction, le clic ouvre simplement l'URL dans un nouvel onglet.
 */
export interface ExternalLink {
    id: string
    title: string
    url: string
}
