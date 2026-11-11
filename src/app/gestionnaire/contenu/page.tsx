import { Suspense } from "react"
import { getCurrentSession, isAccountActive, getUserById } from "@/_mocks/users.mock"
import { getContentModules, getModulesPendingReview, getTrashedModulesForOrganization } from "@/_mocks/contentModules.mock"
import { getVersionsForModule } from "@/_mocks/moduleVersions.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getAttributionLabel, mostRecent } from "@/lib/contentSharing"
import { getSharedModuleGroups } from "@/lib/contentSharing"
import { getUnresolvedCommentCount } from "@/_mocks/reviewComments.mock"
import { getForkableModules } from "@/_mocks/moduleVersions.actions"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getFullName } from "@/lib/user"
import GestionnaireContenuView, {
    type ModuleCardData,
    type TrashedModuleData,
} from "@/app/gestionnaire/_components/contenu/GestionnaireContenuView"
import styles from "./page.module.css"

/**
 * Server Component : même principe que côté formateur (fetch uniquement,
 * ContenuView gère l'état des onglets côté client).
 *
 * Différences avec le formateur :
 * - "Privé" inclut aussi les brouillons des comptes désactivés
 *   (orphelins, sans formateur pour s'en occuper)
 * - "À réviser" en plus — modules déjà appliqués automatiquement mais
 *   jamais confirmés/révisés (getModulesPendingReview)
 * - "Partagé" exclut la version déjà dans "À réviser" (pendingReviewVersionIds)
 *   pour ne pas l'afficher deux fois — voir lib/contentSharing.ts
 * - Pas de "Mes publications" : depuis que publier soi-même s'applique ET
 *   se marque révisé du même geste (voir publishVersion), cet onglet ne
 *   peut structurellement plus jamais contenir quoi que ce soit pour ce rôle.
 * - "Corbeille" : le gestionnaire peut y mettre n'importe quel module de
 *   l'org (canTrash toujours true ici), pas seulement le sien — voir
 *   canTrashModule, lib/contentTrash.ts.
 */
export default async function GestionnaireContenuPage() {
    const { user, gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const [modules, organization, pendingReviewEntries, trashedModules] = await Promise.all([
        getContentModules(organizationId),
        getOrganizationById(organizationId),
        getModulesPendingReview(organizationId),
        getTrashedModulesForOrganization(organizationId),
    ])
    const organizationName = organization?.name ?? "l'organisation"

    // La version à exclure de "Partagé" est celle de chaque entrée, pas
    // forcément module.officialVersionId : une version resoumise n'est
    // pas nécessairement la version officielle actuelle.
    const pendingReviewVersionIds = new Set(pendingReviewEntries.map((entry) => entry.version.id))
    const sharedGroups = await getSharedModuleGroups(organizationId, user.id, organizationName, pendingReviewVersionIds)
    const [templateModules, categories] = await Promise.all([
        getForkableModules(organizationId),
        getCategoriesForOrganization(organizationId),
    ])

    const modulesWithVersions = await Promise.all(
        modules.map(async (module) => ({ module, versions: await getVersionsForModule(module.id) }))
    )

    const draftCards: ModuleCardData[] = []
    const officialCards: ModuleCardData[] = []

    for (const { module, versions } of modulesWithVersions) {
        // Mes brouillons + ceux des comptes désactivés (orphelins, personne d'autre pour s'en occuper) — vérifié par créateur de version, pas par module (un module peut avoir des brouillons de plusieurs personnes).
        const draftsToShow: typeof versions = []
        for (const v of versions.filter((v) => v.status === "draft")) {
            if (v.createdByUserId === user.id) {
                draftsToShow.push(v)
                continue
            }
            const isActive = await isAccountActive(v.createdByUserId)
            if (!isActive) draftsToShow.push(v)
        }
        if (draftsToShow.length > 0) {
            const displayVersion = mostRecent(draftsToShow)
            const unresolvedCommentCount = await getUnresolvedCommentCount(displayVersion.id)
            draftCards.push({
                module,
                displayVersion,
                attributionLabel: getAttributionLabel(displayVersion, module, organizationName),
                unresolvedCommentCount,
                canTrash: true, // gestionnaire — toujours autorisé, voir canTrashModule
            })
        }

        if (module.officialVersionId) {
            const displayVersion = versions.find((v) => v.id === module.officialVersionId)
            if (displayVersion) {
                officialCards.push({
                    module,
                    displayVersion,
                    attributionLabel: getAttributionLabel(displayVersion, module, organizationName),
                    canTrash: true,
                })
            }
        }
    }

    const pendingReviewCards: ModuleCardData[] = pendingReviewEntries.map(({ module, version }) => ({
        module,
        displayVersion: version,
        attributionLabel: getAttributionLabel(version, module, organizationName),
    }))

    const trashedModuleData: TrashedModuleData[] = await Promise.all(
        trashedModules.map(async (module) => {
            const trashedByUser = module.trashedByUserId ? await getUserById(module.trashedByUserId) : undefined
            return { module, trashedByName: trashedByUser ? getFullName(trashedByUser) : "quelqu'un" }
        })
    )

    return (
        <div className={styles.pageWrapper}>
            <Suspense fallback={null}>
                <GestionnaireContenuView
                    draftCards={draftCards}
                    officialCards={officialCards}
                    pendingReviewCards={pendingReviewCards}
                    sharedGroups={sharedGroups}
                    templateModules={templateModules}
                    trashedModules={trashedModuleData}
                    categories={categories}
                    organizationId={organizationId}
                    organizationName={organizationName}
                    userId={user.id}
                />
            </Suspense>
        </div>
    )
}