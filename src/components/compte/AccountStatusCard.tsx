import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import { getAccountStatusEntries } from "@/lib/accountStatus"
import type { UserSession } from "@/types/user"
import styles from "./AccountStatusCard.module.css"

interface AccountStatusCardProps {
    session: UserSession
}

/**
 * Une entrée par rôle actif — additif, pas exclusif (voir
 * lib/accountStatus.ts). Même carte pour tous les rôles, seul le contenu
 * des entrées change. Async : getAccountStatusEntries résout
 * getOrganizationById en interne.
 */
export default async function AccountStatusCard({ session }: AccountStatusCardProps) {
    const entries = await getAccountStatusEntries(session)
    if (entries.length === 0) return null

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader title="Mon statut" />

            <div className={styles.entries}>
                {entries.map((entry) => (
                    <div key={entry.roleLabel} className={styles.entry}>
                        <span className={styles.badge}>{entry.roleLabel.toUpperCase()}</span>
                        <p className={styles.description}>{entry.description}</p>
                    </div>
                ))}
            </div>
        </Card>
    )
}