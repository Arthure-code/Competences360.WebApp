import { getAllAdmins, getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { redirect } from "next/navigation"
import { routes } from "@/constants/routes"
import AdministrateursView from "@/app/admin/_components/administrateurs/AdministrateursView"

/**
 * Liste tous les comptes admin (actifs et désactivés) — auparavant,
 * aucun moyen de voir qui a accès à la console, ni d'en ajouter sans
 * modifier le code et redéployer (voir adminAuth.seed.ts).
 */
export default async function AdministrateursPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const admins = await getAllAdmins()

    return <AdministrateursView admins={admins} currentAdminId={session.admin.id} />
}