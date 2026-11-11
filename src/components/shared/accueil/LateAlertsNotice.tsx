import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { routes } from "@/constants/routes"
import type { LateAlertEntry } from "@/lib/formateurDashboard"
import styles from "./LateAlertsNotice.module.css"

interface LateAlertsNoticeProps {
    entries: LateAlertEntry[]
    /**
     * Absent côté gestionnaire, pas encore de page de détail par
     * apprenant sous /gestionnaire (contrairement à
     * routes.formateur.apprenants.bySlug). Chaque ligne reste alors du
     * texte simple plutôt qu'un lien vers une route qui n'existe pas.
     */
    role?: "formateur" | "gestionnaire"
}

/**
 * Pointe vers QUI est en retard, pas juste QUOI, chaque ligne mène
 * directement au détail de l'apprenant concerné (formateur seulement pour
 * l'instant), pas juste un compteur agrégé sans action possible.
 */
export default function LateAlertsNotice({ entries, role }: LateAlertsNoticeProps) {
    if (entries.length === 0) return null

    const visibleEntries = entries.slice(0, 4)
    const remainingCount = entries.length - visibleEntries.length

    return (
        <div className={styles.notice}>
            <div className={styles.header}>
                <FontAwesomeIcon icon={faTriangleExclamation} className={styles.icon} aria-hidden="true" />
                <span className={styles.title}>
                    {entries.length} module{entries.length > 1 ? "s" : ""} en retard
                </span>
            </div>

            <ul className={styles.list}>
                {visibleEntries.map((entry, index) => {
                    const content = (
                        <>
                            <strong>{entry.apprenantFullName}</strong> : {entry.moduleTitle}
                        </>
                    )
                    return (
                        <li key={index}>
                            {role === "formateur" ? (
                                <Link href={routes.formateur.apprenants.bySlug(entry.apprenantUserId)} className={styles.entryLink}>
                                    {content}
                                </Link>
                            ) : (
                                <span className={styles.entryText}>{content}</span>
                            )}
                        </li>
                    )
                })}
            </ul>

            {remainingCount > 0 && <p className={styles.more}>+ {remainingCount} autre{remainingCount > 1 ? "s" : ""}</p>}
        </div>
    )
}