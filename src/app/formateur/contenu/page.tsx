import { Suspense } from "react"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getContentModules, getTrashedModulesForOrganization } from "@/_mocks/contentModules.mock"
import { getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getAttributionLabel, mostRecent } from "@/lib/contentSharing"
import { getSharedModuleGroups } from "@/lib/contentSharing"
import { getUnresolvedCommentCount } from "@/_mocks/reviewComments.mock"
import { getForkableModules } from "@/_mocks/moduleVersions.actions"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getModuleCountForCategory } from "@/lib/categoryUsage"
import { canTrashModule } from "@/lib/contentTrash"
import { getUserById } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import FormateurContenuView, {
    type ModuleCardData,
    type TrashedModuleData,
} from "@/app/formateur/_components/contenu/FormateurContenuView"
import styles from "./page.module.css"

/**
 * Server Component : fetch uniquement — Tabs a besoin d'état client, donc
 * tout le reste vit dans ContenuView. Une carte par ContentModule (pas par
 * version) pour Privé/Contenu de l'org — un même module peut apparaître
 * dans plusieurs onglets à la fois (ex. brouillon en cours ET déjà une
 * version officielle) : chaque onglet résout SA PROPRE version pertinente.
 * "Partagé" est groupé par module plutôt qu'une carte par version — voir
 * lib/contentSharing.ts.
 */
export default async function FormateurContenuPage() {
    const { user, formateurProfile } = await getCurrentSession()
    const organizationId = formateurProfile?.organizationId ?? ""
    const isGestionnaireOfThisOrg = user.roles.includes("gestionnaire")

    const [modules, organization, trashedModules] = await Promise.all([
        getContentModules(organizationId),
        getOrganizationById(organizationId),
        getTrashedModulesForOrganization(organizationId),
    ])
    const organizationName = organization?.name ?? "l'organisation"

    const sharedGroups = await getSharedModuleGroups(organizationId, user.id, organizationName)
    const [templateModules, categories] = await Promise.all([
        getForkableModules(organizationId),
        getCategoriesForOrganization(organizationId),
    ])

    // Calculé ici, côté SERVEUR — auparavant chargé côté client à
    // l'ouverture du modal Catégories (openCategoriesModal), ce qui lisait
    // une copie du tableau CATEGORIES isolée dans le navigateur, jamais
    // celle mutée par createCategory (une vraie Server Action). Passer ces
    // données en props, comme categories ci-dessus, permet à
    // router.refresh() (appelé après une création réussie, voir
    // CategoriesManager.tsx) de vraiment les rafraîchir — exactement le
    // même piège déjà documenté pour apprenantModuleProgress.mock.ts.
    const categoryModuleCounts: Record<string, number> = {}
    await Promise.all(
        categories.map(async (category) => {
            categoryModuleCounts[category.id] = await getModuleCountForCategory(category.id, organizationId)
        })
    )

    const modulesWithVersions = await Promise.all(
        modules.map(async (module) => ({ module, versions: await getVersionsForModule(module.id) }))
    )

    const draftCards: ModuleCardData[] = []
    const officialCards: ModuleCardData[] = []

    for (const { module, versions } of modulesWithVersions) {
        // Épopée 4 — un formateur ne peut mettre à la corbeille que son
        // propre contenu (voir canTrashModule, lib/contentTrash.ts), un
        // gestionnaire peut tout — false ici puisque cette page est
        // scopée formateur.
        const canTrash = canTrashModule(module, versions, user.id, isGestionnaireOfThisOrg)

        const myDrafts = versions.filter((v) => v.createdByUserId === user.id && v.status === "draft")
        if (myDrafts.length > 0) {
            const displayVersion = mostRecent(myDrafts)
            const unresolvedCommentCount = await getUnresolvedCommentCount(displayVersion.id)
            draftCards.push({
                module,
                displayVersion,
                attributionLabel: getAttributionLabel(displayVersion, module, organizationName),
                unresolvedCommentCount,
                canTrash,
            })
        }

        if (module.officialVersionId) {
            const displayVersion = versions.find((v) => v.id === module.officialVersionId)
            if (displayVersion) {
                officialCards.push({
                    module,
                    displayVersion,
                    attributionLabel: getAttributionLabel(displayVersion, module, organizationName),
                    canTrash,
                })
            }
        }
    }

    const trashedModuleData: TrashedModuleData[] = await Promise.all(
        trashedModules.map(async (module) => {
            const trashedByUser = module.trashedByUserId ? await getUserById(module.trashedByUserId) : undefined
            return { module, trashedByName: trashedByUser ? getFullName(trashedByUser) : "quelqu'un" }
        })
    )

    return (
        <div className={styles.pageWrapper}>
            <Suspense fallback={null}>
                <FormateurContenuView
                    draftCards={draftCards}
                    officialCards={officialCards}
                    sharedGroups={sharedGroups}
                    templateModules={templateModules}
                    trashedModules={trashedModuleData}
                    categories={categories}
                    categoryModuleCounts={categoryModuleCounts}
                    organizationId={organizationId}
                    organizationName={organizationName}
                    userId={user.id}
                    isGestionnaireOfThisOrg={isGestionnaireOfThisOrg}
                />
            </Suspense>
        </div>
    )
}