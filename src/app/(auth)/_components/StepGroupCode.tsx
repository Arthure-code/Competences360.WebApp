import JoinGroupForm, { type GroupCodeTab } from "@/components/shared/JoinGroupForm"
import StepShell from "./StepShell"
import styles from "./StepGroupCode.module.css"

export type { GroupCodeTab }

interface StepGroupCodeProps {
    activeTab: GroupCodeTab
    onTabChange: (tab: GroupCodeTab) => void
    code: string
    onCodeChange: (value: string) => void
    error: string | null
    onBack: () => void
    onSubmit: () => void
}

export default function StepGroupCode({
    activeTab,
    onTabChange,
    code,
    onCodeChange,
    error,
    onBack,
    onSubmit,
}: StepGroupCodeProps) {
    return (
        <StepShell
            title="Avez-vous un code de groupe ? (facultatif)"
            subtitle={
                <>
                    Si vous avez un formateur et qu'il vous a remis un code de groupe, entrez-le ici ou
                    scannez-le pour rejoindre votre groupe. Vous pouvez aussi continuer sans code et explorer la
                    plateforme librement.
                </>
            }
            footer={{
                backLabel: "Retour",
                onBack,
                continueLabel: code.trim() ? "Rejoindre le groupe" : "Passer cette étape",
                onContinue: onSubmit,
            }}
        >
            <div className={styles.card}>
                <JoinGroupForm
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    code={code}
                    onCodeChange={onCodeChange}
                    error={error}
                />
            </div>
        </StepShell>
    )
}
