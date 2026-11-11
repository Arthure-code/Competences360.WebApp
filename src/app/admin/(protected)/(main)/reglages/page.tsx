import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getPlatformConfigurationWithOverride } from "@/_mocksToMigrate/configuration.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { getGlobalCategoryUsageCount } from "@/_mocksAdmin/adminContent.actions"
import { routes } from "@/constants/routes"
import ReglagesView from "@/app/admin/_components/reglages/ReglagesView"

/**
 * Visible par TOUS les admins (pas réservé aux comptes racine) — un
 * Administrateur/Propriétaire doit pouvoir CONSULTER ces réglages, utile
 * en soi. Seule la MODIFICATION reste réservée aux comptes racine (voir
 * ReglagesView.tsx, isRoot déterminant si les champs sont éditables ou
 * juste affichés), énoncé explicitement sur la page plutôt que caché.
 */
export default async function ReglagesPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const config = await getPlatformConfigurationWithOverride()
    const categories = await getAllCategories()
    const globalCategories = categories.filter((c) => c.scope === "global")
    const moduleCounts: Record<string, number> = {}
    await Promise.all(
        globalCategories.map(async (c) => {
            moduleCounts[c.id] = await getGlobalCategoryUsageCount(c.id)
        })
    )

    return (
        <ReglagesView
            config={config}
            isRoot={session.admin.isRoot}
            globalCategories={globalCategories}
            moduleCounts={moduleCounts}
            adminId={session.admin.id}
        />
    )
}