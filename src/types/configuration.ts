/** Règles chiffrées de la plateforme, servies par `GET /api/configuration`. */
export interface PlatformConfiguration {
    /** Jours de récupération d'un module en corbeille avant purge définitive. */
    joursCorbeilleContenu: number

    /** Jours entre une demande de suppression de compte et l'anonymisation. */
    joursAvantAnonymisationCompte: number

    /** Jours entre le départ d'un groupe et la rupture définitive du lien. */
    joursAvantPurgeAdhesion: number

    /** Nombre maximal de versions par module. */
    maxVersionsParModule: number

    /** Rang à partir duquel prévenir qu'on approche de la limite de versions. */
    seuilAvertissementVersions: number

    /** Pourcentage du score maximum à atteindre pour qu'une activité compte comme réussie. */
    seuilReussiteNiveauPourcent: number

    /** Jours sans activité au-delà desquels un apprenant est signalé. */
    joursInactivite: number

    /** Points d'un exercice réussi du premier coup. */
    pointsExerciceReussi: number

    /** Points d'un échec final. */
    pointsExercicePartiel: number

    /** Poids maximal d'une image téléversée, en octets. */
    maxImageOctets: number

    /** Poids maximal d'une vidéo téléversée, en octets. */
    maxVideoOctets: number

    /** Poids maximal d'un fichier audio téléversé, en octets. */
    maxAudioOctets: number
}
