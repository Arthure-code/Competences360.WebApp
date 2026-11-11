import { getCurrentSession } from "@/_mocks/users.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getModuleCountForCategory } from "@/lib/categoryUsage"
import OrganizationInfoCard from "@/components/organisation/OrganizationInfoCard"
import CategoriesManager from "@/components/shared/CategoriesManager"
import styles from "./page.module.css"

/**
 * Regroupe tout ce qui concerne l'ORGANISATION elle-même — nom (voir
 * OrganizationInfoCard, déplacé ici depuis Paramètres) et catégories
 * org-scopées (épopée 8) — distinct de Paramètres, qui reste vraiment
 * personnel (notifications, langue, confidentialité). Aussi l'endroit
 * naturel où le futur rôle Administrateur consultera une org précise
 * (voir la discussion sur ce rôle, en pause).
 *
 */
export default async function GestionnaireOrganisationPage() {
    const { user, gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const [organization, categories] = await Promise.all([
        getOrganizationById(organizationId),
        getCategoriesForOrganization(organizationId),
    ])

    const moduleCounts: Record<string, number> = {}
    await Promise.all(
        categories.map(async (category) => {
            moduleCounts[category.id] = await getModuleCountForCategory(category.id, organizationId)
        })
    )

    if (!organization) return null

    return (
        <div className={styles.page}>
            <OrganizationInfoCard organization={organization} />
            <CategoriesManager
                categories={categories}
                moduleCounts={moduleCounts}
                organizationId={organizationId}
                userId={user.id}
                isGestionnaireOfThisOrg={true}
            />
        </div>
    )
}