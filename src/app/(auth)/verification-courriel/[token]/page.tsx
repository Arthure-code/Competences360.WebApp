import { getEmailVerificationToken } from "@/_mocks/emailVerification.mock"
import InvalidLinkMessage from "@/app/(auth)/_components/InvalidLinkMessage"
import EmailVerificationResult from "@/app/(auth)/_components/EmailVerificationResult"
import styles from "./page.module.css"

interface VerifyEmailPageProps {
    params: Promise<{ token: string }>
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
    const { token } = await params
    const verificationToken = await getEmailVerificationToken(token)

    return (
        <div className={styles.page}>
            {!verificationToken ? (
                <InvalidLinkMessage
                    title="Ce lien n'est plus valide"
                    message="Il a peut-être déjà été utilisé, ou votre courriel est déjà confirmé."
                    actionHref="/connexion"
                    actionLabel="Aller à la connexion"
                />
            ) : (
                <EmailVerificationResult token={token} />
            )}
        </div>
    )
}