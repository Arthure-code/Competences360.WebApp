import Link from "next/link"
import PageHeader from "@/components/ui/PageHeader"
import Breadcrumb from "@/components/ui/Breadcrumb"
import StatGrid from "@/components/ui/StatGrid"
import Avatar from "@/components/ui/Avatar"
import Card from "@/components/ui/Card"
import { ROLE_LABELS } from "@/constants/roles"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import type { Role } from "@/constants/roles"
import type { StaffDossierStats } from "@/lib/staffDossier"
import styles from "./StaffDossierView.module.css"

interface StaffDossierViewProps {
    fullName: string
    avatarUrl?: string
    roles: Role[]
    hiredAt?: string
    dossier: StaffDossierStats
    breadcrumbItems: { label: string; href?: string }[]
    /** Choisit routes.formateur ou routes.gestionnaire pour les liens vers chaque groupe géré — ignoré si getGroupHref est fourni */
    role: "formateur" | "gestionnaire"
    /**
     * Surcharge le calcul du lien vers un groupe — Admin n'a pas de
     * routes[role] équivalentes (pas de session formateur/gestionnaire à
     * emprunter, voir app/admin), lui fournit sa propre route
     * (routes.admin.groupes.bySlug) via cette prop plutôt que d'étendre
     * le type `role` avec une 3e valeur qui n'est pas vraiment un rôle de
     * ce dossier. Optionnelle, rétrocompatible — absent = comportement
     * inchangé pour formateur/gestionnaire (routes[role] comme avant).
     */
    getGroupHref?: (slug: string) => string
}

/**
 * Épopée 17 — dossier complet formateur/gestionnaire. Volontairement
 * mince : contrairement au dossier apprenant (données riches, moments
 * forts, tendances de score), il n'y a rien de plus à agréger pour ce
 * rôle avec les données actuelles — voir la discussion sur l'audit. Une
 * seule vue pour les deux rôles (voir lib/staffDossier.ts) : le genre de
 * données pertinentes est identique, qu'on soit formateur, gestionnaire,
 * ou les deux à la fois.
 */
export default function StaffDossierView({
    fullName,
    avatarUrl,
    roles,
    hiredAt,
    dossier,
    breadcrumbItems,
    role,
    getGroupHref,
}: StaffDossierViewProps) {
    const [firstName, ...rest] = fullName.split(" ")
    const lastName = rest.join(" ")
    const roleLabel = roles.map((r) => ROLE_LABELS[r]).join(" et ")

    const statsItems = [
        { id: "groups", label: "Groupes gérés", value: dossier.managedGroups.length, icon: "faUserGroup" },
        { id: "apprenants", label: "Apprenants sous responsabilité", value: dossier.apprenantCount, icon: "faUsers" },
        { id: "draft", label: "Brouillons", value: dossier.content.draftCount, icon: "faFileLines" },
        { id: "published", label: "Publiés", value: dossier.content.publishedCount, icon: "faCheck" },
        { id: "official", label: "Modules officiels", value: dossier.content.officialCount, icon: "faStar" },
    ]

    return (
        <div className={styles.page}>
            <Breadcrumb items={[...breadcrumbItems, { label: fullName }]} />

            <div className={styles.header}>
                <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size={64} />
                <PageHeader
                    title={fullName}
                    subtitle={hiredAt ? `${roleLabel} — depuis le ${formatLongDateLabel(hiredAt)}` : roleLabel}
                />
            </div>

            <StatGrid items={statsItems} columns={3} />

            <div className={styles.groupsSection}>
                <h2 className={styles.sectionTitle}>Groupes gérés</h2>
                {dossier.managedGroups.length === 0 ? (
                    <p className={styles.emptyText}>Aucun groupe géré pour l'instant.</p>
                ) : (
                    <div className={styles.groupList}>
                        {dossier.managedGroups.map((group) => (
                            <Link key={group.id} href={getGroupHref ? getGroupHref(group.slug) : routes[role].groupes.bySlug(group.slug)}>
                                <Card padding="md" interactive className={styles.groupRow}>
                                    <span className={styles.groupName}>{group.name}</span>
                                    <span className={styles.groupProgress}>{group.averageProgressPercent}% de progression moyenne</span>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}