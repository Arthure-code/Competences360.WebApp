import StepHeader from "./StepHeader"
import Button from "@/components/ui/Button"
import styles from "./StepInviteOnly.module.css"

interface StepInviteOnlyProps {
    message: string
    onBack: () => void
}

/**
 * Cul-de-sac informatif — formateur (toujours) ou gestionnaire (org déjà
 * trouvée). Deux sorties seulement : Retour (corriger un mauvais choix de
 * rôle) ou "J'ai déjà un compte" (vers /connexion) — pas de formulaire ici.
 */
export default function StepInviteOnly({ message, onBack }: StepInviteOnlyProps) {
    return (
        <div className={styles.wrapper}>
            <StepHeader title="Invitation requise" subtitle={message} />
            <div className={styles.actions}>
                <Button label="Retour" variant="outline" onClick={onBack} />
                <Button label="J'ai déjà un compte" variant="ghost" href="/connexion" />
            </div>
        </div>
    )
}
