import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBuilding } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import { formatContactRoleLabel } from "@/lib/groupContact"
import { routes } from "@/constants/routes"
import type { Group } from "@/types/group"
import styles from "./GroupListItem.module.css"

interface GroupListItemProps {
    group: Group
    /** Résolu par l'appelant via getOrganizationById(group.organizationId) */
    organizationName: string
    totalModuleCount: number
    lateModuleCount: number
}

export default function GroupListItem({
    group,
    organizationName,
    totalModuleCount,
    lateModuleCount,
}: GroupListItemProps) {
    return (
        <Card
            href={routes.apprenant.groupes.bySlug(group.slug)}
            interactive
            padding="md"
            className={styles.card}
        >
            <div className={styles.main}>
                <h3 className={styles.name}>{group.name}</h3>
                <span className={styles.org}>
                    <FontAwesomeIcon icon={faBuilding} aria-hidden="true" />
                    {organizationName}
                </span>
            </div>

            <div className={styles.contact}>
                <p className={styles.contactName}>{group.contact.fullName}</p>
                <p className={styles.contactRole}>{formatContactRoleLabel(group.contact.roles)}</p>
            </div>

            <div className={styles.modules}>
                <p className={styles.modulesCount}>
                    {totalModuleCount} module{totalModuleCount > 1 ? "s" : ""}
                </p>
                <p className={lateModuleCount > 0 ? styles.modulesLate : styles.modulesOk}>
                    {lateModuleCount > 0 ? `${lateModuleCount} en retard` : "À jour"}
                </p>
            </div>

            <div className={styles.progress}>
                <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>Moyenne</span>
                    <span className={styles.progressValue}>{group.averageProgressPercent}%</span>
                </div>
                <ProgressBar
                    value={group.averageProgressPercent}
                    ariaLabel={`Progression moyenne, ${group.name}`}
                    className={styles.progressBar}
                />
            </div>
        </Card>
    )
}