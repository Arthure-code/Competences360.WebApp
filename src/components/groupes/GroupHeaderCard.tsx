import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBuilding, faEnvelope, faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import { formatContactRoleLabel } from "@/lib/groupContact"
import type { Group } from "@/types/group"
import styles from "./GroupHeaderCard.module.css"

interface GroupHeaderCardProps {
    group: Group
    /** Résolu par l'appelant via getOrganizationById(group.organizationId) — ce composant reste présentational, sans accès aux mocks/API */
    organizationName: string
    /** Résolu par l'appelant via getMemberCount(memberships, group.id) */
    memberCount: number
    onLeaveGroup?: () => void
}

export default function GroupHeaderCard({
    group,
    organizationName,
    memberCount,
    onLeaveGroup,
}: GroupHeaderCardProps) {
    const roleLabel = formatContactRoleLabel(group.contact.roles)

    return (
        <div className={styles.wrapper}>
            <Card padding="lg" className={styles.card}>
                <div className={styles.info}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.name}>{group.name}</h1>
                        <span className={styles.org}>
                            <FontAwesomeIcon icon={faBuilding} aria-hidden="true" />
                            {organizationName}
                        </span>
                    </div>

                    <div className={styles.metaRow}>
                        <div>
                            <p className={styles.metaValue}>{group.contact.fullName}</p>
                            <p className={styles.metaLabel}>{roleLabel}</p>
                        </div>
                        <div>
                            <p className={styles.metaValue}>{memberCount}</p>
                            <p className={styles.metaLabel}>Effectif actuel</p>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <a href={`mailto:${group.contact.email}`} className={styles.actionLink}>
                            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                            Contacter {roleLabel.toLowerCase()}
                        </a>
                        {onLeaveGroup && (
                            <button type="button" className={styles.actionLink} onClick={onLeaveGroup}>
                                <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
                                Quitter le groupe
                            </button>
                        )}
                    </div>
                </div>
            </Card>
            <Card padding="lg" className={styles.card + " " + styles.progressCard}>
                <div className={styles.progress}>
                    <p className={styles.progressLabel}>Progression du groupe</p>
                    <p className={styles.progressValue}>{group.averageProgressPercent}%</p>
                    <ProgressBar
                        value={group.averageProgressPercent}
                        ariaLabel={`Progression moyenne du groupe ${group.name}`}
                        className={styles.progressBar}
                    />
                    <p className={styles.progressCaption}>Moyenne complétée</p>
                </div>
            </Card>
        </div>
    )
}
