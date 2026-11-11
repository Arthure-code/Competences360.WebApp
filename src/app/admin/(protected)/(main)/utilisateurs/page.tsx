import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations } from "@/_mocksToMigrate/organizations.mock"
import { routes } from "@/constants/routes"
import UtilisateursView from "@/app/admin/_components/utilisateurs/UtilisateursView"

/**
 * Recherche d'abord — aucune donnée de MEMBRES chargée côté serveur, voir
 * UtilisateursView.tsx. La liste des organisations, elle, est chargée ici
 * (courte, 2 orgs dans le seed actuel) — sert le filtre "Organisation" et
 * la pré-sélection via l'URL (?org=... depuis le lien utilitaire du
 * détail d'org).
 */
export default async function UtilisateursPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organizations = await getAllOrganizations()

    return <UtilisateursView organizations={organizations} />
}