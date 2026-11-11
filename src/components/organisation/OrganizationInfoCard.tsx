"use client"

import { useRouter } from "next/navigation"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import StatusBadge from "@/components/ui/StatusBadge"
import EditableField from "@/components/shared/EditableField"
import { updateOrganizationName } from "@/_mocks/organizations.actions"
import type { Organization } from "@/types/organization"
import styles from "./OrganizationInfoCard.module.css"

interface OrganizationInfoCardProps {
    organization: Organization
}

/**
 * Réservé au gestionnaire, seul champ réellement modifiable de
 * l'organisation pour l'instant (voir organizations.actions.ts,
 * subscriptionStatus fixé à "free" tant qu'il n'y a pas de système
 * d'abonnement, affiché en lecture seule, pas éditable).
 *
 * Épopée 8 — déplacé depuis app/gestionnaire/parametres vers
 * app/gestionnaire/organisation : Paramètres reste personnel
 * (notifications, langue, confidentialité), Organisation regroupe ce qui
 * concerne l'org elle-même.
 */
export default function OrganizationInfoCard({ organization }: OrganizationInfoCardProps) {
    const router = useRouter()

    async function handleSaveName(name: string) {
        await updateOrganizationName(organization.id, name)
        router.refresh()
    }

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader title="Organisation" subtitle="Informations générales sur votre organisation." />

            <EditableField label="Nom de l'organisation" value={organization.name} onSave={handleSaveName} />

            <div className={styles.field}>
                <span className={styles.label}>Abonnement</span>
                <StatusBadge variant="success" label="Gratuit" />
            </div>
        </Card>
    )
}