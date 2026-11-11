import { getPasswordResetToken } from "@/_mocks/passwordReset.mock"
import ResetPasswordForm from "@/app/(auth)/_components/ResetPasswordForm"
import InvalidLinkMessage from "@/app/(auth)/_components/InvalidLinkMessage"
import styles from "./page.module.css"

interface ResetPasswordPageProps {
    params: Promise<{ token: string }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
    const { token } = await params
    const resetToken = await getPasswordResetToken(token)

    return (
        <div className={styles.page}>
            {!resetToken ? (
                <InvalidLinkMessage
                    title="Ce lien n'est plus valide"
                    message="Il a peut-être déjà été utilisé, ou il a expiré (valide 24h). Demandez-en un nouveau."
                    actionHref="/mot-de-passe-oublie"
                    actionLabel="Demander un nouveau lien"
                />
            ) : (
                <ResetPasswordForm token={token} />
            )}
        </div>
    )
}