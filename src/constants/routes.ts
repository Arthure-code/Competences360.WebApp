import { Role } from "./roles"

export const routes = {
    public: {
        home: "/",
        support: "/support",
    },
    auth: {
        login: "/connexion",
        register: "/inscription",
        forgotPassword: "/mot-de-passe-oublie",
        resetPassword: (token: string) => `/reinitialisation/${token}`,
        verifyEmail: (token: string) => `/verification-courriel/${token}`,
    },
    apprenant: {
        home: "/apprenant/accueil",
        modules: {
            root: "/apprenant/modules",
            bySlug: (moduleSlug: string) => `/apprenant/modules/${moduleSlug}`,
            niveau: (moduleSlug: string, niveauSlug: string) =>
                `/apprenant/modules/${moduleSlug}/${niveauSlug}`,
            bilan: (moduleSlug: string, niveauSlug: string) =>
                `/apprenant/modules/${moduleSlug}/${niveauSlug}/bilan`,
            exercice: (moduleSlug: string, niveauSlug: string, exerciceSlug: string) =>
                `/apprenant/modules/${moduleSlug}/${niveauSlug}/${exerciceSlug}`,
            filterByCategory: (categoryId: string) => `/apprenant/modules?categorie=${categoryId}`,
            filterByStatus: (statusId: string) => `/apprenant/modules?statut=${statusId}`,
        },
        parcours: "/apprenant/parcours",
        reussites: "/apprenant/reussites",
        groupes: {
            root: "/apprenant/groupes",
            bySlug: (groupSlug: string) => `/apprenant/groupes/${groupSlug}`,
            join: "/apprenant/groupes/rejoindre",
        },
        compte: "/apprenant/compte",
        parametres: "/apprenant/parametres",
    },
    formateur: {
        home: "/formateur/accueil",
        groupes: {
            root: "/formateur/groupes",
            create: "/formateur/groupes/creer",
            bySlug: (groupSlug: string) => `/formateur/groupes/${groupSlug}`,
        },
        apprenants: {
            bySlug: (apprenantId: string) => `/formateur/apprenants/${apprenantId}`,
        },
        monDossier: "/formateur/mon-dossier",
        invitations: "/formateur/invitations",
        assignations: "/formateur/assignations",
        statistiques: "/formateur/statistiques",
        contenu: {
            root: "/formateur/contenu",
            module: (moduleId: string) => `/formateur/contenu/${moduleId}`,
            edit: (moduleId: string, versionId: string) => `/formateur/contenu/${moduleId}/edit/${versionId}`,
            preview: (moduleId: string, versionId: string) => `/formateur/contenu/${moduleId}/preview/${versionId}`,
        },
        compte: "/formateur/compte",
        parametres: "/formateur/parametres",
    },
    gestionnaire: {
        home: "/gestionnaire/accueil",
        contenu: {
            root: "/gestionnaire/contenu",
            module: (moduleId: string) => `/gestionnaire/contenu/${moduleId}`,
            edit: (moduleId: string, versionId: string) => `/gestionnaire/contenu/${moduleId}/edit/${versionId}`,
            preview: (moduleId: string, versionId: string) => `/gestionnaire/contenu/${moduleId}/preview/${versionId}`,
        },
        membres: "/gestionnaire/membres",
        organisation: "/gestionnaire/organisation",
        apprenants: {
            bySlug: (apprenantId: string) => `/gestionnaire/apprenants/${apprenantId}`,
        },
        staff: {
            bySlug: (userId: string) => `/gestionnaire/staff/${userId}`,
        },
        assignations: "/gestionnaire/assignations",
        groupes: {
            root: "/gestionnaire/groupes",
            create: "/gestionnaire/groupes/creer",
            bySlug: (groupSlug: string) => `/gestionnaire/groupes/${groupSlug}`,
        },
        statistiques: "/gestionnaire/statistiques",
        compte: "/gestionnaire/compte",
        parametres: "/gestionnaire/parametres",
    },
    admin: {
        login: "/admin/login",
        home: "/admin/accueil",
        administrateurs: "/admin/administrateurs",
        premiereConnexion: "/admin/premiere-connexion",
        compte: "/admin/compte",
        organisations: {
            root: "/admin/organisations",
            bySlug: (organizationId: string) => `/admin/organisations/${organizationId}`,
        },
        reglages: "/admin/reglages",
        signalements: {
            root: "/admin/signalements",
            bySlug: (reportId: string) => `/admin/signalements/${reportId}`,
        },
        journalAudit: "/admin/journal-audit",
        utilisateurs: {
            root: "/admin/utilisateurs",
            bySlug: (userId: string) => `/admin/utilisateurs/${userId}`,
        },
        groupes: {
            bySlug: (groupSlug: string) => `/admin/groupes/${groupSlug}`,
        },
        parametres: "/admin/parametres",
        contenu: {
            root: "/admin/contenu",
            module: (moduleId: string) => `/admin/contenu/${moduleId}`,
            edit: (moduleId: string, versionId: string) => `/admin/contenu/${moduleId}/edit/${versionId}`,
            preview: (moduleId: string, versionId: string) => `/admin/contenu/${moduleId}/preview/${versionId}`,
        },
        statistiques: "/admin/statistiques",
    },
} as const

/** Page d'atterrissage après connexion, selon le rôle. */
export const ROLE_HOME_PATH: Record<Role, string> = {
    apprenant: routes.apprenant.home,
    formateur: routes.formateur.home,
    gestionnaire: routes.gestionnaire.home,
}