import Card from "@/components/ui/Card"
import { VERSION_STATUS_LABELS } from "@/constants/moduleVersionStatus"
import { formatLongDateLabel } from "@/lib/date"
import { routes } from "@/constants/routes"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./ModuleVersionCard.module.css"

interface ModuleVersionCardProps {
    version: ModuleVersion
    authorName?: string
}

export default function ModuleVersionCard({ version, authorName }: ModuleVersionCardProps) {
    return (
        <Card href={routes.formateur.contenu.edit(version.moduleId, version.id)} interactive padding="md" className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{version.content.title}</h3>
                <span className={`${styles.badge} ${styles[version.status]}`}>
                    {VERSION_STATUS_LABELS[version.status]}
                </span>
            </div>

            <p className={styles.changeNote}>{version.changeNote}</p>

            <p className={styles.meta}>
                {authorName && <>Par {authorName} — </>}
                {formatLongDateLabel(version.createdAt)}
            </p>
        </Card>
    )
}