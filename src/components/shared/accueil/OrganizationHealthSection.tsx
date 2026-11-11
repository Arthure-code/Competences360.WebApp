import Link from "next/link"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import EmptyState from "@/components/ui/EmptyState"
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons"
import { ROLE_LABELS, ROLES } from "@/constants/roles"
import { routes } from "@/constants/routes"
import type { Role } from "@/constants/roles"
import styles from "./OrganizationHealthSection.module.css"

export interface UnassignedModuleEntry {
    moduleId: string
    title: string
}

export interface StagnantGroupEntry {
    groupId: string
    name: string
    memberCount: number
}

export interface OrphanedContentEntry {
    moduleId: string
    title: string
    creatorName: string
}

interface OrganizationHealthSectionProps {
    unassignedModules: UnassignedModuleEntry[]
    stagnantGroups: StagnantGroupEntry[]
    orphanedContent: OrphanedContentEntry[]
    roleDistribution: Record<Role, number>
}

/**
 * Remplace "Apprenants qui ont besoin d'attention"/"Modules en retard"
 * côté gestionnaire (gardés côté formateur, voir AttentionSection.tsx,
 * LateAlertsNotice.tsx) — le niveau de détail d'un formateur qui coache
 * des individus ne convient pas à un gestionnaire qui supervise toute
 * l'org. 3 vrais problèmes structurels actionnables (contenu jamais
 * assigné, groupe stagnant, contenu orphelin d'un compte désactivé) +
 * 1 vue d'ensemble (répartition par rôle), pas un niveau de détail par
 * apprenant.
 */
export default function OrganizationHealthSection({
    unassignedModules,
    stagnantGroups,
    orphanedContent,
    roleDistribution,
}: OrganizationHealthSectionProps) {
    return (
        <div className={styles.grid}>
            <CollapsibleSection title="Répartition des membres">
                <div className={styles.roleBreakdown}>
                    {ROLES.map((role) => (
                        <div key={role} className={styles.roleItem}>
                            <span className={styles.roleCount}>{roleDistribution[role]}</span>
                            <span className={styles.roleLabel}>{ROLE_LABELS[role]}</span>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Contenu jamais assigné" count={unassignedModules.length}>
                {unassignedModules.length === 0 ? (
                    <EmptyState icon={faCircleCheck} title="Tout le contenu officiel est assigné." bordered />
                ) : (
                    <ul className={styles.list}>
                        {unassignedModules.map((entry) => (
                            <li key={entry.moduleId}>
                                <Link href={routes.gestionnaire.contenu.module(entry.moduleId)} className={styles.entryLink}>
                                    {entry.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Groupes sans progression" count={stagnantGroups.length}>
                {stagnantGroups.length === 0 ? (
                    <EmptyState icon={faCircleCheck} title="Tous les groupes progressent." bordered />
                ) : (
                    <ul className={styles.list}>
                        {stagnantGroups.map((entry) => (
                            <li key={entry.groupId}>
                                <span className={styles.entryText}>
                                    {entry.name} ({entry.memberCount} apprenant{entry.memberCount > 1 ? "s" : ""})
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Contenu d'un compte désactivé" count={orphanedContent.length}>
                {orphanedContent.length === 0 ? (
                    <EmptyState icon={faCircleCheck} title="Aucun contenu orphelin." bordered />
                ) : (
                    <ul className={styles.list}>
                        {orphanedContent.map((entry) => (
                            <li key={entry.moduleId}>
                                <Link href={routes.gestionnaire.contenu.module(entry.moduleId)} className={styles.entryLink}>
                                    {entry.title}
                                </Link>
                                <span className={styles.entryMeta}> par {entry.creatorName}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CollapsibleSection>
        </div>
    )
}
