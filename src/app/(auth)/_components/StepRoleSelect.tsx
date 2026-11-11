import { faUser, faUsers, faBuilding } from "@fortawesome/free-solid-svg-icons"
import RadioCard from "./RadioCard"
import StepShell from "./StepShell"
import styles from "./StepRoleSelect.module.css"

export type UserRole = "apprenant" | "formateur" | "organisation"

const ROLES: { value: UserRole; icon: typeof faUser; title: string; description: string }[] = [
    {
        value: "apprenant",
        icon: faUser,
        title: "J'apprends",
        description: "Accédez aux modules, progressez à votre rythme et suivez votre évolution.",
    },
    {
        value: "formateur",
        icon: faUsers,
        title: "Je forme",
        description: "Accompagnez vos apprenants, assignez des parcours et suivez leur progression.",
    },
    {
        value: "organisation",
        icon: faBuilding,
        title: "Je représente une organisation",
        description:
            "Gérez votre équipe, créez du contenu de formation et consultez les résultats globaux de l'entreprise.",
    },
]

interface StepRoleSelectProps {
    value: UserRole | null
    onChange: (role: UserRole) => void
    onContinue: () => void
}

export default function StepRoleSelect({ value, onChange, onContinue }: StepRoleSelectProps) {
    return (
        <StepShell
            title="Choisissez votre profil"
            subtitle="Sélectionnez le rôle qui correspond le mieux à votre situation."
            footer={{
                backLabel: "Retour à la connexion",
                backHref: "/connexion",
                continueLabel: "Continuer",
                onContinue,
                continueDisabled: !value,
            }}
        >
            <div className={styles.list}>
                {ROLES.map((role) => (
                    <RadioCard
                        key={role.value}
                        name="role"
                        icon={role.icon}
                        title={role.title}
                        description={role.description}
                        selected={value === role.value}
                        onSelect={() => onChange(role.value)}
                    />
                ))}
            </div>
        </StepShell>
    )
}