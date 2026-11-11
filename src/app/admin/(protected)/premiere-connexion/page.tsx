import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAdminFullName } from "@/lib/adminUser"
import { routes } from "@/constants/routes"
import PremiereConnexionForm from "@/app/admin/_components/premiere-connexion/PremiereConnexionForm"

/** force-dynamic : même raison que les layouts parents — la session dépend d'un cookie. */
export const dynamic = "force-dynamic"

/**
 * Vit dans (protected) mais PAS dans (main) — voir les deux layouts.
 * Une session valide suffit pour arriver ici (garanti par (protected)),
 * mais cette page ne dépend PAS de hasChangedPassword pour être
 * accessible (contrairement à tout ce qui vit dans (main)) — sinon
 * personne ne pourrait jamais l'atteindre pour justement changer ce mot
 * de passe.
 *
 * Si le mot de passe a déjà été changé (quelqu'un revient ici par erreur,
 * ou via un lien direct), redirige vers l'accueil — cette page n'a plus
 * de raison d'être pour cette personne.
 */
export default async function PremiereConnexionPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)
    if (session.admin.hasChangedPassword) redirect(routes.admin.home)

    return <PremiereConnexionForm adminName={getAdminFullName(session.admin)} />
}