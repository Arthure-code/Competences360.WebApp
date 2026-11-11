import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import styles from "./CommentBadge.module.css"

interface CommentBadgeProps {
    total: number
    unresolved: number
}

/**
 * Rien si aucun commentaire, un chiffre si des commentaires non résolus
 * restent, un crochet une fois tout traité, voir la discussion sur le
 * mécanisme de révision. Réutilisé sur les lignes d'activité
 * (NiveauSidebar) et d'exercice (ActivityWorkspace).
 */
export default function CommentBadge({ total, unresolved }: CommentBadgeProps) {
    if (total === 0) return null
    if (unresolved === 0) {
        return (
            <span className={styles.resolvedBadge} aria-label="Tous les commentaires sont résolus">
                <FontAwesomeIcon icon={faCheck} />
            </span>
        )
    }
    return (
        <span className={styles.unresolvedBadge} aria-label={`${unresolved} commentaire${unresolved > 1 ? "s" : ""} non résolu${unresolved > 1 ? "s" : ""}`}>
            {unresolved}
        </span>
    )
}
