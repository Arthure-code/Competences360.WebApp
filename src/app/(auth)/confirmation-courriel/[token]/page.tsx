import EmailChangeResult from "@/app/(auth)/_components/EmailChangeResult"
import InvalidLinkMessage from "@/app/(auth)/_components/InvalidLinkMessage"
import styles from "./page.module.css"

interface ConfirmEmailChangePageProps {
    params: Promise<{ token: string }>
    searchParams: Promise<{ adresse?: string; action?: string }>
}

/** Ouvert depuis l'un des deux courriels : confirme, ou annule, le changement d'adresse. */
export default async function ConfirmEmailChangePage({ params, searchParams }: ConfirmEmailChangePageProps) {
    const { token } = await params
    const { adresse, action } = await searchParams

    return (
        <div className={styles.page}>
            {adresse !== "ancienne" && adresse !== "nouvelle" ? (
                <InvalidLinkMessage
                    title="Ce lien n'est pas complet"
                    message="Ouvrez le lien directement depuis le courriel reçu."
                    actionHref="/connexion"
                    actionLabel="Aller à la connexion"
                />
            ) : (
                <EmailChangeResult token={token} adresse={adresse} annuler={action === "annuler"} />
            )}
        </div>
    )
}
