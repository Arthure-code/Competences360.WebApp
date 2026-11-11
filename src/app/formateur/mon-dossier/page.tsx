import { getCurrentSession } from "@/_mocks/users.mock"
import { getFullName } from "@/lib/user"
import { computeStaffDossier } from "@/lib/staffDossier"
import StaffDossierView from "@/components/shared/StaffDossierView"
import styles from "./page.module.css"

/**
 * Épopée 17 — dossier complet du formateur lui-même, pas de bySlug (voir
 * routes.formateur.monDossier) : un formateur ne consulte jamais le
 * dossier de quelqu'un d'autre, seulement le sien. hiredAt disponible ici
 * (contrairement à la page équivalente gestionnaire qui consulte un
 * autre membre) puisque formateurProfile vient directement de la propre
 * session de la personne.
 */
export default async function MonDossierPage() {
    const { user, formateurProfile } = await getCurrentSession()
    const dossier = await computeStaffDossier(user.id)

    return (
        <div className={styles.pageWrapper}>
            <StaffDossierView
                fullName={getFullName(user)}
                avatarUrl={user.avatarUrl}
                roles={user.roles}
                hiredAt={formateurProfile?.hiredAt}
                dossier={dossier}
                breadcrumbItems={[]}
                role="formateur"
            />
        </div>
    )
}