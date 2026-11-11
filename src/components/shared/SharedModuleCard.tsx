import Link from "next/link"
import Card from "@/components/ui/Card"
import CollapsibleGroup from "@/components/shared/CollapsibleGroup"
import VersionStatusBadge from "@/components/shared/VersionStatusBadge"
import { routes } from "@/constants/routes"
import type { SharedModuleGroup } from "@/lib/contentSharing"
import styles from "./SharedModuleCard.module.css"

interface SharedModuleCardProps {
    group: SharedModuleGroup
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu, sinon un gestionnaire atterrissait sur les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
}

/**
 * Un module = un groupe repliable, chaque version publiée listée dessous,
 * évite l'effet "2 cartes qui se ressemblent sans lien visible" quand
 * plusieurs formateurs publient chacun leur propre version du même
 * module (voir la discussion sur le regroupement, même principe qu'un
 * dépôt GitHub qui groupe ses branches). Chaque ligne mène à l'éditeur,
 * pas juste informative : modifiable si c'est la sienne, lecture seule
 * (avec possibilité de commenter pour un gestionnaire) sinon, voir
 * EditorView.tsx.
 */
export default function SharedModuleCard({ group, role }: SharedModuleCardProps) {
    return (
        <Card padding="none">
            <CollapsibleGroup
                label={`${group.module.title} (${group.versions.length})`}
                className={styles.group}
                triggerClassName={styles.trigger}
            >
                <div className={styles.versionList}>
                    {group.versions.map(({ version, versionNumber, attributionLabel, isMine, coverageCount }) => (
                        <Link
                            key={version.id}
                            href={routes[role].contenu.edit(version.moduleId, version.id)}
                            className={styles.versionRow}
                        >
                            <div className={styles.versionInfo}>
                                <div className={styles.versionTitleRow}>
                                    <span className={styles.versionNumber}>v{versionNumber}</span>
                                    {isMine && <span className={styles.mineBadge}>Votre version</span>}
                                    <VersionStatusBadge version={version} isOfficial={false} />
                                </div>
                                <span className={styles.attribution}>{attributionLabel}</span>
                            </div>
                            <span className={styles.coverage}>
                                {coverageCount === 0
                                    ? "Pas encore assignée"
                                    : `${coverageCount} apprenant${coverageCount > 1 ? "s" : ""} couvert${coverageCount > 1 ? "s" : ""}`}
                            </span>
                        </Link>
                    ))}
                </div>
            </CollapsibleGroup>
        </Card>
    )
}