import { notFound } from "next/navigation"
import { getContentModuleById } from "@/_mocks/contentModules.mock"
import { getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getAllCategories } from "@/_mocks/categories.mock"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import ModulePageView from "@/app/formateur/_components/contenu/ModulePageView"

interface ModulePageProps {
    params: Promise<{ moduleId: string }>
}

/**
 * Réutilise ModulePageView (formateur) tel quel — seule différence :
 * canApply={true}, la vraie logique déjà en place dans ce composant
 * (voir ModulePageView.tsx) plutôt qu'un composant dupliqué.
 */
export default async function GestionnaireModulePage({ params }: ModulePageProps) {
    const { moduleId } = await params
    const contentModule = await getContentModuleById(moduleId)
    if (!contentModule) notFound()

    const [versions, organization, categories, { user }] = await Promise.all([
        getVersionsForModule(moduleId),
        getOrganizationById(contentModule.organizationId),
        getAllCategories(),
        getCurrentSession(),
    ])

    return (
        <ModulePageView
            module={contentModule}
            versions={versions}
            organizationName={organization?.name ?? "l'organisation"}
            categories={categories}
            userId={user.id}
            userFullName={getFullName(user)}
            canApply
            role="gestionnaire"
        />
    )
}


