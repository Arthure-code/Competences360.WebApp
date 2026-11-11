import Link from "next/link"
import Button from "@/components/ui/Button"
import styles from "./StepFooterNav.module.css"

interface StepFooterNavProps {
    backLabel: string
    /** Fournir soit backHref (lien vers une autre route), soit onBack (callback, ex: étape précédente du wizard) */
    backHref?: string
    onBack?: () => void
    continueLabel: string
    onContinue: () => void
    continueDisabled?: boolean
}

export default function StepFooterNav({
    backLabel,
    backHref,
    onBack,
    continueLabel,
    onContinue,
    continueDisabled = false,
}: StepFooterNavProps) {
    return (
        <div className={styles.footerNav}>
            {backHref ? (
                <Link href={backHref} className={styles.backLink}>
                    <span aria-hidden="true">←</span> {backLabel}
                </Link>
            ) : (
                <button type="button" className={styles.backLink} onClick={onBack}>
                    <span aria-hidden="true">←</span> {backLabel}
                </button>
            )}

            <Button
                label={`${continueLabel} →`}
                variant="secondary"
                onClick={onContinue}
                disabled={continueDisabled}
            />
        </div>
    )
}