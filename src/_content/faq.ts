import type { FaqItem } from "@/types/faq.ts"

/**
 * Sorti de FaqAccordion.tsx — pas de logique ici, seulement de la
 * donnée. Répond au même principe qu'ailleurs dans le projet : un
 * composant de rendu ne devrait jamais porter une liste de contenu figée
 * en dur dans son propre fichier, plus facile à retrouver/modifier
 * séparément (et un jour, à remplacer par un vrai fetch depuis une
 * table FAQ, sans toucher au composant).
 */
export const FAQ_ITEMS: FaqItem[] = [
    {
        id: "join-group",
        question: "Comment rejoindre un groupe de formation ?",
        answer:
            "Votre formateur vous a remis un code ou un lien d'invitation. Cliquez sur  « Joindre un groupe » dans la barre du haut, entrez votre code ou scannez le QR code fourni.",
    },
    {
        id: "forgot-password",
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer:
            "Sur la page de connexion, cliquez sur « Mot de passe oublié » et suivez les instructions envoyées par courriel pour créer un nouveau mot de passe.",
    },
    {
        id: "resume-progress",
        question: "Comment reprendre là où je me suis arrêté ?",
        answer:
            "Votre progression est enregistrée automatiquement. Connectez-vous et accédez à votre tableau de bord : vous reprendrez exactement où vous vous étiez arrêté.",
    },
    {
        id: "badges-certificates",
        question: "Où trouver mes badges et certificats ?",
        answer:
            "Rendez-vous dans la section « Mes réalisations » de votre profil pour consulter et télécharger tous vos badges et certificats obtenus.",
    },
    {
        id: "contact-trainer",
        question: "Comment contacter mon formateur ?",
        answer:
            "Utilisez la messagerie intégrée disponible dans votre espace de groupe, ou consultez les coordonnées partagées par votre formateur au sein du groupe.",
    },
    {
        id: "mobile-use",
        question: "Puis-je utiliser la plateforme sur mon téléphone ?",
        answer:
            "Oui, la plateforme est entièrement accessible depuis un navigateur mobile et s'adapte automatiquement à la taille de votre écran.",
    },
    {
        id: "data-security",
        question: "Mes données sont-elles en sécurité ?",
        answer:
            "Oui, toutes vos données sont chiffrées et hébergées de façon sécurisée. Elles ne sont jamais partagées avec des tiers sans votre consentement. Vous pouvez consulter notre [politique de confidentialité](/politique-de-confidentialite) ou notre [politique de cookies](/politique-de-cookies) pour plus de détails sur la protection de vos informations personnelles.",
    },
]
