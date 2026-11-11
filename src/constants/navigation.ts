import {
    faFolderOpen,
    faGear,
    faHouse,
    faLayerGroup,
    faPaperPlane,
    faRoute,
    faTrophy,
    faUser,
    faUserGroup,
    faUsers,
    faClipboardList,
    faChartLine,
    faBuilding,
} from "@fortawesome/free-solid-svg-icons"

import type { SidebarItem } from "@/components/layout/Sidebar"
import { Role } from "./roles"
import { routes } from "./routes"

/**
 * Un seul endroit où routes + icônes + libellés se rencontrent pour former
 * la config du Sidebar. `roles.ts`/`routes.ts` restent des données pures ;
 * ce fichier est la couche qui les assemble en config UI.
 */
export const NAVIGATION: Record<Role, SidebarItem[]> = {
    apprenant: [
        { label: "Accueil", href: routes.apprenant.home, icon: faHouse },
        { label: "Modules", href: routes.apprenant.modules.root, icon: faLayerGroup },
        { label: "Mon parcours", href: routes.apprenant.parcours, icon: faRoute },
        { label: "Mes réussites", href: routes.apprenant.reussites, icon: faTrophy },
        { label: "Mes groupes", href: routes.apprenant.groupes.root, icon: faUserGroup },
        { label: "Mon compte", href: routes.apprenant.compte, icon: faUser },
        { label: "Paramètres", href: routes.apprenant.parametres, icon: faGear },
    ],
    formateur: [
        { label: "Accueil", href: routes.formateur.home, icon: faHouse },
        { label: "Mes groupes", href: routes.formateur.groupes.root, icon: faUserGroup },
        { label: "Invitations", href: routes.formateur.invitations, icon: faPaperPlane },
        { label: "Assignations", href: routes.formateur.assignations, icon: faClipboardList },
        { label: "Contenu", href: routes.formateur.contenu.root, icon: faFolderOpen },
        { label: "Statistiques", href: routes.formateur.statistiques, icon: faChartLine },
        { label: "Mon compte", href: routes.formateur.compte, icon: faUser },
        { label: "Paramètres", href: routes.formateur.parametres, icon: faGear },
    ],
    gestionnaire: [
        { label: "Accueil", href: routes.gestionnaire.home, icon: faHouse },
        { label: "Contenu", href: routes.gestionnaire.contenu.root, icon: faFolderOpen },
        { label: "Groupes", href: routes.gestionnaire.groupes.root, icon: faUserGroup },
        { label: "Assignations", href: routes.gestionnaire.assignations, icon: faClipboardList },
        { label: "Membres", href: routes.gestionnaire.membres, icon: faUsers },
        { label: "Statistiques", href: routes.gestionnaire.statistiques, icon: faChartLine },
        { label: "Organisation", href: routes.gestionnaire.organisation, icon: faBuilding },
        { label: "Mon compte", href: routes.gestionnaire.compte, icon: faUser },
        { label: "Paramètres", href: routes.gestionnaire.parametres, icon: faGear },
    ],
}