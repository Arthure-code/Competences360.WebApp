import Link from "next/link"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/ui/StatusBadge"
import { routes } from "@/constants/routes"
import type { AdminUser } from "@/types/adminUser"
import type { Organization } from "@/types/organization"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import styles from "./AdminAccueilView.module.css"

interface AdminAccueilViewProps {
    admin: AdminUser
    membersByOrg: { org: Organization; members: OrganizationMember[] }[]
}

/**
 * "Ce qui a besoin d'attention" — orienté problème, pas orienté
 * compréhension (ça, c'est Statistiques plateforme, une page à part).
 * Version 1, avec ce qui est déjà disponible : orgs désactivées, orgs
 * sans membre actif. La stagnation de groupes/apprenants (comme côté
 * gestionnaire) viendra dans une prochaine passe.
 */
export default function AdminAccueilView({ admin, membersByOrg }: AdminAccueilViewProps) {
    const totalOrgs = membersByOrg.length
    const activeOrgs = membersByOrg.filter(({ org }) => org.isActive !== false)
    const inactiveOrgs = membersByOrg.filter(({ org }) => org.isActive === false)
    const orgsWithNoActiveMembers = activeOrgs.filter(({ members }) => !members.some((m) => m.isActive))

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Bonjour, {admin.preferredFirstName || admin.firstName}</h1>

            <div className={styles.statsRow}>
                <StatCard label="Organisations" value={totalOrgs} />
                <StatCard label="Actives" value={activeOrgs.length} />
                <StatCard label="Désactivées" value={inactiveOrgs.length} />
            </div>

            <Card padding="lg" className={styles.card}>
                <h2 className={styles.sectionTitle}>Besoin d&apos;attention</h2>

                {orgsWithNoActiveMembers.length === 0 && inactiveOrgs.length === 0 ? (
                    <p className={styles.empty}>Rien ne nécessite d&apos;attention pour l&apos;instant.</p>
                ) : (
                    <div className={styles.attentionList}>
                        {orgsWithNoActiveMembers.map(({ org }) => (
                            <AttentionRow
                                key={org.id}
                                label={org.name}
                                reason="Aucun membre actif"
                                href={routes.admin.organisations.bySlug(org.id)}
                            />
                        ))}
                        {inactiveOrgs.map(({ org }) => (
                            <AttentionRow
                                key={org.id}
                                label={org.name}
                                reason="Organisation désactivée"
                                href={routes.admin.organisations.bySlug(org.id)}
                            />
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <Card padding="md" className={styles.statCard}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
        </Card>
    )
}

function AttentionRow({ label, reason, href }: { label: string; reason: string; href: string }) {
    return (
        <Link href={href} className={styles.attentionRow}>
            <span className={styles.attentionLabel}>{label}</span>
            <StatusBadge variant="neutral" label={reason} />
        </Link>
    )
}