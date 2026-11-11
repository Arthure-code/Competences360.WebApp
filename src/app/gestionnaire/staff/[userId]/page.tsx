import { notFound } from "next/navigation"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { computeStaffDossier } from "@/lib/staffDossier"
import { routes } from "@/constants/routes"
import StaffDossierView from "@/components/shared/StaffDossierView"
import styles from "./page.module.css"

interface StaffDetailPageProps {
    params: Promise<{ userId: string }>
}

/**
 * Épopée 17 — n'existait pas du tout : cliquer sur un formateur/
 * gestionnaire depuis Membres ne menait nulle part. Réservé aux membres
 * avec au moins un des deux rôles staff (formateur et/ou gestionnaire) —
 * un apprenant dans la liste Membres a sa propre page dédiée
 * (routes.gestionnaire.apprenants).
 *
 * hiredAt absent ici : getOrganizationMembers (annuaire org, voir
 * organizationMembers.mock.ts) n'expose pas FormateurProfile en entier,
 * seulement l'identité de base — illustratif comme le reste de ce mock,
 * limité aux quelques comptes vraiment nommés.
 */
export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
    const { userId } = await params
    const { gestionnaireProfile } = await getCurrentSession()
    const organizationId = gestionnaireProfile?.organizationId ?? ""

    const members = await getOrganizationMembers(organizationId)
    const member = members.find((m) => m.id === userId)
    if (!member) notFound()
    if (!member.roles.includes("formateur") && !member.roles.includes("gestionnaire")) notFound()

    const dossier = await computeStaffDossier(userId)

    return (
        <div className={styles.pageWrapper}>
            <StaffDossierView
                fullName={member.fullName}
                roles={member.roles}
                dossier={dossier}
                breadcrumbItems={[{ label: "Membres", href: routes.gestionnaire.membres }]}
                role="gestionnaire"
            />
        </div>
    )
}