import Tabs from "@/components/ui/Tabs"
import Button from "@/components/ui/Button"
import GroupCodeInput from "./GroupCodeInput"
import QrScanner from "./QrScanner"
import styles from "./JoinGroupForm.module.css"
import Notice from "./Notice"

export type GroupCodeTab = "code" | "qr"

const STATUS_TABS = [
    { id: "code", label: "Entrer un code" },
    { id: "qr", label: "Scanner un QR code" },
] as const

interface JoinGroupFormProps {
    activeTab: GroupCodeTab
    onTabChange: (tab: GroupCodeTab) => void
    code: string
    onCodeChange: (value: string) => void
    error: string | null
    /**
     * Fourni par les contextes autonomes (page Mes groupes, futur modal
     * "+ Rejoindre un groupe") où ce formulaire porte sa propre action.
     * Absent dans le wizard d'inscription, où le footer de StepShell
     * ("Rejoindre le groupe" / "Passer cette étape") joue déjà ce rôle —
     * éviter d'avoir deux boutons de soumission dans cet écran.
     */
    submit?: {
        label: string
        onSubmit: () => void
        disabled?: boolean
    }
}

export default function JoinGroupForm({
    activeTab,
    onTabChange,
    code,
    onCodeChange,
    error,
    submit,
}: JoinGroupFormProps) {
    return (
        <div className={styles.form}>

            <Tabs
                items={STATUS_TABS}
                active={activeTab}
                onChange={(id) => onTabChange(id as GroupCodeTab)}
                className={styles.customTabs}
            />

            <div className={styles.content}>
                {activeTab === "code" ? (
                    <GroupCodeInput value={code} onChange={onCodeChange} hasError={!!error} />
                ) : (
                    <QrScanner
                        code={code}
                        onScan={(valeur) => {
                            // On repasse sur l'onglet saisie : l'apprenant VOIT
                            // le code capturé avant de valider, plutôt qu'une
                            // adhésion déclenchée par surprise depuis un viseur.
                            onCodeChange(valeur)
                            onTabChange("code")
                        }}
                    />
                )}

                {error && (
                    <Notice notice={{ variant: "error", message: error }} size="sm" />
                )}
            </div>

            {submit && (
                <Button
                    label={submit.label}
                    onClick={submit.onSubmit}
                    disabled={submit.disabled}
                    fullWidth
                />
            )}
        </div>
    )
}