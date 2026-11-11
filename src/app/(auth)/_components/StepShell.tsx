import type { ReactNode } from "react"
import StepHeader from "./StepHeader"
import StepFooterNav from "./StepFooterNav"
import styles from "./StepShell.module.css"

interface StepShellFooterProps {
    backLabel: string
    /** Fournir soit backHref (lien vers une autre route), soit onBack (callback, ex: étape précédente du wizard) */
    backHref?: string
    onBack?: () => void
    continueLabel: string
    onContinue: () => void
    continueDisabled?: boolean
}

interface StepShellProps {
    title: string
    subtitle: ReactNode
    footer: StepShellFooterProps
    children: ReactNode
}

export default function StepShell({ title, subtitle, footer, children }: StepShellProps) {
    return (
        <div className={styles.step}>
            <StepHeader title={title} subtitle={subtitle} />
            {children}
            <StepFooterNav {...footer} />
        </div>
    )
}
