import Link from "next/link"
import LogoPrimary from "@/components/ui/LogoPrimary"
import MiniFooter from "@/components/layout/MiniFooter"
import styles from "./ConfirmationAdhesion.module.css"

interface ConfirmationAdhesionProps {
	erreur: string
}

/**
 * Seul l'ÉCHEC a besoin d'un écran : quand l'invitation s'applique, la page
 * de confirmation redirige aussitôt vers l'espace correspondant au nouveau
 * rôle. Un message « c'est fait » suivi d'un clic n'apporterait rien.
 */
export default function ConfirmationAdhesion({ erreur }: ConfirmationAdhesionProps) {
	return (
		<div className={styles.page}>
			<div className={styles.wrapper}>
				<LogoPrimary />

				<h1 className={styles.title}>Adhésion impossible</h1>
				<p className={styles.message} role="alert">
					{erreur}
				</p>
				<p className={styles.help}>
					Demandez un nouveau lien à la personne qui vous a invité, ou vérifiez que vous êtes
					connecté avec le compte auquel l invitation a été adressée.
				</p>

				<Link href="/connexion" className={styles.link}>
					Retour à la connexion
				</Link>
			</div>

			<MiniFooter />
		</div>
	)
}