import CollapsibleSection from "@/components/ui/CollapsibleSection"
import EmptyState from "@/components/ui/EmptyState"
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons"
import ApprenantRosterRow from "@/app/formateur/_components/groupes/ApprenantRosterRow"
import { routes } from "@/constants/routes"
import type { ApprenantSummary } from "@/types/apprenantSummary"
import styles from "./AttentionSection.module.css"

interface AttentionSectionProps {
    apprenants: ApprenantSummary[]
    /** Absent côté gestionnaire, pas encore de page de détail par apprenant sous /gestionnaire, voir ApprenantRosterRow.tsx */
    role?: "formateur" | "gestionnaire"
}

/**
 * Réutilise ApprenantRosterRow (déjà construit pour Détail groupe), même
 * ligne, contexte différent, pas de composant dupliqué.
 */
export default function AttentionSection({ apprenants, role }: AttentionSectionProps) {
    return (
        <CollapsibleSection title="Apprenants qui ont besoin d'attention" count={apprenants.length}>
            {apprenants.length === 0 ? (
                <EmptyState
                    icon={faCircleCheck}
                    title="Tout le monde est à jour."
                    description="Aucun apprenant n'a besoin d'attention particulière en ce moment."
                    bordered
                />
            ) : (
                <div className={styles.list}>
                    {apprenants.map((summary) => (
                        <ApprenantRosterRow
                            key={summary.userId}
                            summary={summary}
                            href={role === "formateur" ? routes.formateur.apprenants.bySlug(summary.userId) : undefined}
                        />
                    ))}
                </div>
            )}
        </CollapsibleSection>
    )
}