"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { demanderChangementCourriel } from "@/_mocks/courriel.actions"
import styles from "./ChangePasswordModal.module.css"

interface ChangeEmailModalProps {
	isOpen: boolean
	onClose: () => void
}

/** Changement d'adresse courriel : mot de passe actuel exigé, puis confirmation depuis l'ancienne et la nouvelle adresse. */
export default function ChangeEmailModal({ isOpen, onClose }: ChangeEmailModalProps) {
	const [nouveauCourriel, setNouveauCourriel] = useState("")
	const [motDePasse, setMotDePasse] = useState("")
	const [erreur, setErreur] = useState<string | null>(null)
	const [enCours, setEnCours] = useState(false)
	const [envoye, setEnvoye] = useState(false)

	function fermer() {
		setNouveauCourriel("")
		setMotDePasse("")
		setErreur(null)
		setEnvoye(false)
		onClose()
	}

	async function soumettre(event: React.FormEvent) {
		event.preventDefault()
		if (enCours) return

		setEnCours(true)
		setErreur(null)

		const resultat = await demanderChangementCourriel(nouveauCourriel, motDePasse)

		setMotDePasse("")
		setEnCours(false)

		if (!resultat.succes) {
			setErreur(resultat.erreur ?? null)
			return
		}

		setEnvoye(true)
	}

	return (
		<Modal isOpen={isOpen} onClose={fermer} maxWidth={520} ariaLabel="Modifier mon adresse courriel">
			<h2 className={styles.title}>Modifier mon adresse courriel</h2>

			{envoye ? (
				<div className={styles.done}>
					<p className={styles.doneText} role="status">
						Ouvrez le lien envoyé à {nouveauCourriel} pour confirmer votre nouvelle adresse. Un avis a été envoyé à votre adresse actuelle.
					</p>
					<Button label="Fermer" onClick={fermer} fullWidth />
				</div>
			) : (
				<form className={styles.form} method="post" onSubmit={soumettre}>
					<Input
						id="nouveauCourriel"
						type="email"
						label="Nouvelle adresse courriel"
						autoComplete="email"
						value={nouveauCourriel}
						onChange={(e) => setNouveauCourriel(e.target.value)}
						required
					/>
					<Input
						id="motDePasseActuelCourriel"
						type="password"
						label="Mot de passe actuel"
						autoComplete="current-password"
						value={motDePasse}
						onChange={(e) => setMotDePasse(e.target.value)}
						required
					/>

					{erreur && (
						<ul className={styles.errors} role="alert">
							<li>{erreur}</li>
						</ul>
					)}

					<div className={styles.actions}>
						<Button label="Annuler" variant="outline" onClick={fermer} type="button" />
						<Button label={enCours ? "Envoi…" : "Continuer"} type="submit" disabled={enCours} />
					</div>
				</form>
			)}
		</Modal>
	)
}
