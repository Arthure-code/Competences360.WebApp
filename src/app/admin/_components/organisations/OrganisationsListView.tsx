"use client"

import Link from "next/link"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/ui/StatusBadge"
import { routes } from "@/constants/routes"
import { highlightMatches } from "@/lib/textHighlight"
import { useAdminSearchQuery } from "@/app/admin/_components/AdminSearchContext"
import type { Organization } from "@/types/organization"
import styles from "./OrganisationsListView.module.css"

interface OrganisationsListViewProps {
    organizations: Organization[]
}

/** Filtre+surligne avec la requête de la topbar (voir AdminSearchContext.tsx) — même mécanique que Journal d'audit. */
export default function OrganisationsListView({ organizations }: OrganisationsListViewProps) {
    const query = useAdminSearchQuery()
    const normalized = query.trim().toLowerCase()
    const filtered = normalized ? organizations.filter((org) => org.name.toLowerCase().includes(normalized)) : organizations

    return (
        <div className={styles.page}>
            <PageHeader title="Organisations" subtitle="Toutes les organisations de la plateforme." />

            {filtered.length === 0 ? (
                <p className={styles.empty}>Aucune organisation trouvée.</p>
            ) : (
                <div className={styles.list}>
                    {filtered.map((org) => (
                        <Link key={org.id} href={routes.admin.organisations.bySlug(org.id)} className={styles.rowLink}>
                            <Card padding="md" className={styles.row}>
                                <span className={styles.name}>{highlightMatches(org.name, query, styles.highlight)}</span>
                                <StatusBadge
                                    variant={org.isActive === false ? "neutral" : "success"}
                                    label={org.isActive === false ? "Désactivée" : "Active"}
                                />
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}