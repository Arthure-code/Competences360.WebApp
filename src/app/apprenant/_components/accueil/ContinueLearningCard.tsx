import Card from "@/components/ui/Card"
import ProgressBar from "@/components/ui/ProgressBar"
import Button from "@/components/ui/Button"
import styles from "./ContinueLearningCard.module.css"

interface InProgressState {
    status: "in-progress"
    savedAtLabel: string
    questionProgressLabel: string
    exerciseTitle: string 
    progressPercent: number
    resumeHref: string
}

interface EmptyStateVariant {
    status: "empty"
    exploreHref: string
}

type ContinueLearningCardProps = InProgressState | EmptyStateVariant



export default function ContinueLearningCard(props: ContinueLearningCardProps) {
    if (props.status === "empty") {
        return (
            <Card padding="lg" className={styles.card}>
                <p className={styles.emptyTitle}>Vous n'avez pas d'activité entamé</p>
                <Button label="Explorer les modules →" variant="primary" href={props.exploreHref} />
            </Card>
        )
    }

    return (
        <Card padding="lg" className={styles.card}>
            <div className={styles.meta}>
                <span className={styles.savedAt}>{props.savedAtLabel.toUpperCase()}</span>
                <span className={styles.questionProgress}>{props.questionProgressLabel}</span>
            </div>

            <h3 className={styles.exerciseTitle}>{props.exerciseTitle}</h3>

            <ProgressBar value={props.progressPercent} ariaLabel={props.exerciseTitle} />

            <Button label="Reprendre ici →" variant="primary" fullWidth href={props.resumeHref} />
        </Card>
    )
}