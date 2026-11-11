import Link from "next/link"
import Card from "@/components/ui/Card"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import type { AdminUser } from "@/types/adminUser"
import styles from "./AdminRoleStatusCard.module.css"

interface AdminRoleStatusCardProps {
    admin: AdminUser
}

/**
 * Équivalent Admin de AccountStatusCard (components/compte/) — rôle,
 * statut racine, date d'adhésion. Le rôle n'est PAS modifiable ici :
 * "Gérer un administrateur" (Administrateurs) permet déjà de se
 * sélectionner soi-même avec toutes les vraies protections déjà en place
 * (dernier propriétaire/racine actif) — dupliquer cette logique dans une
 * 2e carte risquerait de diverger avec le temps, juste un lien vers ce
 * flux existant.
 */
export default function AdminRoleStatusCard({ admin }: AdminRoleStatusCardProps) {
    return (
        <Card padding="lg" className={styles.card}>
            <h2 className={styles.title}>Rôle et statut</h2>

            <div className={styles.row}>
                <span className={styles.label}>Rôle</span>
                <span className={styles.value}>
                    {admin.isOwner ? "Propriétaire" : "Administrateur"}
                    {admin.isRoot && " — Compte racine"}
                </span>
            </div>

            <div className={styles.row}>
                <span className={styles.label}>Membre depuis</span>
                <span className={styles.value}>{formatLongDateLabel(admin.createdAt)}</span>
            </div>

            <p className={styles.hint}>
                Pour changer votre rôle, rendez-vous dans{" "}
                <Link href={routes.admin.administrateurs} className={styles.link}>
                    Administrateurs
                </Link>{" "}
                → Gérer un administrateur.
            </p>
        </Card>
    )
}
