"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { changerMonMotDePasse } from "@/_mocks/motDePasse.actions"
import styles from "./ChangePasswordModal.module.css"

interface ChangePasswordModalProps {
	isOpen: boolean
	onClose: () => void
}

/**
 * Changement de mot de passe, commun à tous les rôles.
 *
 * Une fenêtre plutôt qu'une page : l'écran « Mon compte » existe dans les
 * quatre espaces, et une page dédiée aurait voulu dire quatre routes de plus
 * dans `constants/routes.ts` pour un seul formulaire de trois champs.
 *
 * Le mot de passe actuel est exigé — par le serveur, pas par cet écran.
 * C'est ce qui empêche quelqu'un tombé sur une session ouverte de
 * s'approprier le compte pour de bon.
 */
export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
	const [actuel, setActuel] = useState("")
	const [nouveau, setNouveau] = useState("")
	const [confirmation, setConfirmation] = useState("")
	const [erreurs, setErreurs] = useState<string[]>([])
	const [enCours, setEnCours] = useState(false)
	const [reussi, setReussi] = useState(false)

	function fermer() {
		setActuel("")
		setNouveau("")
		setConfirmation("")
		setErreurs([])
		setReussi(false)
		onClose()
	}

	async function soumettre(event: React.FormEvent) {
		event.preventDefault()
		if (enCours) return

		setEnCours(true)
		setErreurs([])

		const resultat = await changerMonMotDePasse({ actuel, nouveau, confirmation })

		if (!resultat.succes) {
			setErreurs(resultat.erreurs ?? ["Le mot de passe n'a pas pu être changé."])
			setEnCours(false)
			return
		}

		// Les champs sont vidés tout de suite : laisser un mot de passe en
		// clair dans un formulaire encore monté n'apporte rien.
		setActuel("")
		setNouveau("")
		setConfirmation("")
		setEnCours(false)
		setReussi(true)
	}

	return (
		<Modal isOpen={isOpen} onClose={fermer} maxWidth={520} ariaLabel="Modifier mon mot de passe">
			<h2 className={styles.title}>Modifier mon mot de passe</h2>

			{reussi ? (
				<div className={styles.done}>
					<p className={styles.doneText} role="status">
						Votre mot de passe a été modifié. Il sera demandé à votre prochaine connexion.
					</p>
					<Button label="Fermer" onClick={fermer} fullWidth />
				</div>
			) : (
				<form className={styles.form} method="post" onSubmit={soumettre}>
					<Input
						id="motDePasseActuel"
						type="password"
						label="Mot de passe actuel"
						autoComplete="current-password"
						value={actuel}
						onChange={(e) => setActuel(e.target.value)}
						required
					/>
					<Input
						id="motDePasseNouveau"
						type="password"
						label="Nouveau mot de passe"
						autoComplete="new-password"
						value={nouveau}
						onChange={(e) => setNouveau(e.target.value)}
						required
					/>
					<Input
						id="motDePasseConfirmation"
						type="password"
						label="Confirmer le nouveau mot de passe"
						autoComplete="new-password"
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
						required
					/>

					{erreurs.length > 0 && (
						<ul className={styles.errors} role="alert">
							{erreurs.map((message) => (
								<li key={message}>{message}</li>
							))}
						</ul>
					)}

					<div className={styles.actions}>
						<Button label="Annuler" variant="outline" onClick={fermer} type="button" />
						<Button
							label={enCours ? "Modification…" : "Modifier"}
							type="submit"
							disabled={enCours}
						/>
					</div>
				</form>
			)}
		</Modal>
	)
}