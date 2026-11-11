import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getUserAcrossOrgs } from "@/_mocksToMigrate/userSearch.mock"
import { computeApprenantDossier } from "@/lib/apprenantDossier"
import { computeStaffDossier } from "@/lib/staffDossier"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getGroupsForOrganizationWithFallback } from "@/_mocksToMigrate/groups.mock"
import { getAllOrganizations } from "@/_mocksToMigrate/organizations.mock"
import ApprenantDossierView from "@/components/shared/ApprenantDossierView"
import StaffDossierView from "@/components/shared/StaffDossierView"
import UserAccountStatusBar from "@/app/admin/_components/utilisateurs/UserAccountStatusBar"
import ManageApprenantGroupsButton from "@/app/admin/_components/utilisateurs/ManageApprenantGroupsButton"
import ManageStaffRolesButton from "@/app/admin/_components/utilisateurs/ManageStaffRolesButton"
import { routes } from "@/constants/routes"

interface UtilisateurDossierPageProps {
    params: Promise<{ userId: string }>
}

/**
 * Une seule route pour les 3 rôles — pas apprenants/[id],
 * staff/[id]/formateur, staff/[id]/gestionnaire comme côté gestionnaire.
 * types/user.ts confirme qu'apprenant n'est jamais cumulé avec un autre
 * rôle : il n'existe réellement que 2 formes de dossier possibles,
 * choisies ici selon les vrais rôles de la personne — même esprit que
 * GitHub/Slack (une seule URL de profil, le contenu s'adapte).
 *
 * getGroupHref fourni à StaffDossierView (voir sa prop optionnelle,
 * ajoutée pour ce besoin précis) — Admin n'a pas de routes[role]
 * équivalentes, pointe vers /admin/groupes/[slug] à la place.
 */
export default async function UtilisateurDossierPage({ params }: UtilisateurDossierPageProps) {
    const { userId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const user = await getUserAcrossOrgs(userId)
    if (!user) notFound()

    const breadcrumbItems = [
        { label: "Utilisateurs", href: routes.admin.utilisateurs.root },
        ...(user.organizationId
            ? [{ label: user.organizationName, href: routes.admin.organisations.bySlug(user.organizationId) }]
            : []),
    ]

    if (user.roles.includes("apprenant")) {
        // Un compte de REPLI (voir organizationMembersFallback.seed.ts) a un id
        // fictif ("fallback-usr-X"), jamais reconnu par le vrai backend — les
        // appels de computeApprenantDossier (progression, moments forts...)
        // échouent alors avec une erreur de validation ("id invalide"). Pas
        // un vrai bug : ces comptes servent à tester la recherche/liste, pas
        // un dossier complet, qui a besoin de vraies données backend pour
        // exister. Message clair plutôt que de laisser planter la page.
        // Chargé hors du try/catch — toujours disponible pour le bouton
        // Gérer, même si le dossier lui-même échoue (compte de repli).
        const organizationGroups = await getGroupsForOrganizationWithFallback(user.organizationId)

        let dossier
        let categories
        try {
            ;[dossier, categories] = await Promise.all([
                computeApprenantDossier(user.id),
                getCategoriesForOrganization(user.organizationId),
            ])
        } catch {
            return (
                <>
                    <UserAccountStatusBar
                        userId={user.id}
                        userName={user.fullName}
                        organizationId={user.organizationId}
                        isActive={user.isActive}
                    />
                    <div style={{ marginBottom: 16 }}>
                        <ManageApprenantGroupsButton apprenant={user} organizationGroups={organizationGroups} />
                    </div>
                    <p style={{ padding: 24, color: "#92600a", background: "#fff3d6", borderRadius: 8 }}>
                        Impossible de charger le dossier complet de {user.fullName} — ce compte semble être un compte
                        de repli temporaire (voir organizationMembersFallback.seed.ts), sans vraies données de
                        progression côté backend pour l&apos;instant.
                    </p>
                </>
            )
        }

        return (
            <>
                <UserAccountStatusBar
                    userId={user.id}
                    userName={user.fullName}
                    organizationId={user.organizationId}
                    isActive={user.isActive}
                />
                <div style={{ marginBottom: 16 }}>
                    <ManageApprenantGroupsButton apprenant={user} organizationGroups={organizationGroups} />
                </div>
                <ApprenantDossierView
                fullName={user.fullName}
                avatarUrl={undefined}
                // ⚠️ NOTÉ POUR PLUS TARD (pas propre à Admin — touche aussi formateur/gestionnaire) :
                // computeApprenantDossier (lib/apprenantDossier.ts) aplatit tout, aucune
                // répartition par groupe assignateur. Un apprenant dans plusieurs groupes
                // ne peut pas voir "par groupe" vs "ensemble" — demanderait de modifier le
                // vrai computeApprenantDossier + ApprenantDossierView (composants partagés),
                // pas juste un ajustement Admin. Le nom de l'org sert de repère en attendant.
                groupName={user.organizationName}
                breadcrumbItems={breadcrumbItems}
                dossier={dossier}
                categories={categories}
                // ⚠️ Tendance de score non calculée pour Admin (ApprenantSummary.scoreTrend est scopé par formateur) — le composant affiche "—" proprement si null.
                scoreTrend={null}
                />
            </>
        )
    }

    const [dossier, allOrganizations] = await Promise.all([computeStaffDossier(user.id), getAllOrganizations()])

    return (
        <>
            <UserAccountStatusBar
                userId={user.id}
                userName={user.fullName}
                organizationId={user.organizationId}
                isActive={user.isActive}
            />
            <div style={{ marginBottom: 16 }}>
                <ManageStaffRolesButton
                    userId={user.id}
                    userName={user.fullName}
                    currentRoles={user.roles}
                    currentOrganizationId={user.organizationId}
                    allOrganizations={allOrganizations}
                />
            </div>
            <StaffDossierView
                fullName={user.fullName}
                avatarUrl={undefined}
                roles={user.roles}
                hiredAt={undefined}
                dossier={dossier}
                breadcrumbItems={breadcrumbItems}
                role="gestionnaire"
                getGroupHref={(slug) => routes.admin.groupes.bySlug(slug)}
            />
        </>
    )
}