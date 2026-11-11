import type { NotificationPref } from "@/components/parametres/NotificationsCard"

/**
 * Même patron que APPRENANT_/FORMATEUR_/GESTIONNAIRE_NOTIFICATION_PREFS
 * (NotificationsCard.tsx, le vrai fichier) — mais définie ICI plutôt que
 * d'ajouter un export à ce fichier partagé, pour ne pas le modifier.
 *
 * Regroupées par catégorie plutôt qu'une entrée par action précise — les
 * 17 types d'action du Journal d'audit (voir types/auditLog.ts,
 * AuditActionType, la liste la plus complète de "tout ce qui peut se
 * passer" dans l'espace Admin) donneraient 17 interrupteurs, la plupart
 * jamais ajustés séparément en pratique. Regroupés ici en 7 catégories
 * cohérentes, chacune couvrant plusieurs actions du journal.
 */
export const ADMIN_NOTIFICATION_PREFS: NotificationPref[] = [
    {
        id: "reports",
        label: "Signalements",
        description: "Nouveau signalement soumis, ou resté sans réponse plus de 7 jours",
        defaultChecked: true,
    },
    {
        id: "organizations",
        label: "Organisations",
        description: "Une organisation est activée, désactivée ou renommée",
        defaultChecked: true,
    },
    {
        id: "members",
        label: "Membres",
        description: "Rôle ou affiliation d'organisation corrigés pour un membre",
        defaultChecked: false,
    },
    {
        id: "user-accounts",
        label: "Comptes utilisateurs",
        description: "Un compte apprenant/formateur/gestionnaire est activé ou désactivé",
        defaultChecked: false,
    },
    {
        id: "admin-accounts",
        label: "Comptes administrateurs",
        description: "Création, désactivation, réactivation, promotion ou rétrogradation d'un compte admin",
        defaultChecked: true,
    },
    {
        id: "root-account",
        label: "Compte racine",
        description: "Un nouveau compte racine est désigné — l'action la plus sensible de la plateforme",
        defaultChecked: true,
    },
    {
        id: "configuration",
        label: "Réglages de la plateforme",
        description: "Les réglages globaux (seuils, rétention, points) sont modifiés",
        defaultChecked: true,
    },
    {
        id: "categories",
        label: "Catégories",
        description: "Une catégorie de contenu est modifiée ou supprimée",
        defaultChecked: false,
    },
    {
        id: "audit-log",
        label: "Journal d'audit",
        description: "Être notifié à chaque nouvelle entrée du journal, peu importe le type d'action — un filet de sécurité en plus des catégories ci-dessus",
        defaultChecked: false,
    },
]