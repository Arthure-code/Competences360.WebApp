"use client"

import { useState } from "react"
import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import PhoneInput from "@/components/ui/PhoneInput"
import { demanderChangementTelephone, verifierChangementTelephone } from "@/_mocks/telephone.actions"
import styles from "./ChangePasswordModal.module.css"
import cases from "./ChangePhoneModal.module.css"

const LONGUEUR_CODE = 6

interface ChangePhoneModalProps {
	isOpen: boolean
	onClose: () => void
	onChange: (nouveauNumero: string) => void
}

/** Ajout ou changement de numéro : code envoyé par SMS au numéro saisi, puis vérifié. */
export default function ChangePhoneModal({ isOpen, onClose, onChange }: ChangePhoneModalProps) {
	const [numero, setNumero] = useState("")
	const [code, setCode] = useState("")
	const [etape, setEtape] = useState<"demande" | "code" | "termine">("demande")
	const [erreur, setErreur] = useState<string | null>(null)
	const [enCours, setEnCours] = useState(false)

	function fermer() {
		setNumero("")
		setCode("")
		setEtape("demande")
		setErreur(null)
		onClose()
	}

	async function demander(event: React.FormEvent) {
		event.preventDefault()
		if (enCours) return

		setEnCours(true)
		setErreur(null)

		const resultat = await demanderChangementTelephone(numero)

		setEnCours(false)

		if (!resultat.succes) {
			setErreur(resultat.erreur ?? null)
			return
		}

		setEtape("code")
	}

	async function verifier(valeur: string) {
		if (enCours) return

		setEnCours(true)
		setErreur(null)

		const resultat = await verifierChangementTelephone(numero, valeur)

		setEnCours(false)

		if (!resultat.succes) {
			setErreur(resultat.erreur ?? null)
			setCode("")
			return
		}

		onChange(numero)
		setEtape("termine")
	}

	return (
		<Modal isOpen={isOpen} onClose={fermer} maxWidth={520} ariaLabel="Modifier mon numéro de téléphone">
			<h2 className={styles.title}>Modifier mon numéro de téléphone</h2>

			{etape === "demande" && (
				<form className={styles.form} method="post" onSubmit={demander}>
					<PhoneInput id="nouveauTelephone" name="nouveauTelephone" label="Nouveau numéro" value={numero} onChange={setNumero} required />

					{erreur && (
						<ul className={styles.errors} role="alert">
							<li>{erreur}</li>
						</ul>
					)}

					<div className={styles.actions}>
						<Button label="Annuler" variant="outline" onClick={fermer} type="button" />
						<Button label={enCours ? "Envoi…" : "Recevoir un code"} type="submit" disabled={enCours || numero === ""} />
					</div>
				</form>
			)}

			{etape === "code" && (
				<div className={styles.form}>
					<p className={styles.doneText}>Entrez le code à {LONGUEUR_CODE} chiffres reçu par SMS.</p>
					<OTPInput
						maxLength={LONGUEUR_CODE}
						value={code}
						onChange={setCode}
						onComplete={verifier}
						pattern={REGEXP_ONLY_DIGITS}
						autoComplete="one-time-code"
						disabled={enCours}
						containerClassName={cases.otp}
						render={({ slots }) => (
							<div className={cases.slots}>
								{slots.map((slot, idx) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: les cases du code ont une position fixe et ne sont jamais réordonnées (exemple du README d'input-otp)
									<Case key={idx} {...slot} />
								))}
							</div>
						)}
					/>

					{erreur && (
						<ul className={styles.errors} role="alert">
							<li>{erreur}</li>
						</ul>
					)}

					<div className={styles.actions}>
						<Button label="Changer de numéro" variant="outline" onClick={() => setEtape("demande")} type="button" />
						<Button label={enCours ? "Vérification…" : "Valider"} onClick={() => verifier(code)} disabled={enCours || code.length < LONGUEUR_CODE} />
					</div>
				</div>
			)}

			{etape === "termine" && (
				<div className={styles.done}>
					<p className={styles.doneText} role="status">
						Votre numéro est enregistré. Vous pouvez maintenant l'utiliser pour vous connecter.
					</p>
					<Button label="Fermer" onClick={fermer} fullWidth />
				</div>
			)}
		</Modal>
	)
}

/** Une case du code : le chiffre saisi, et le curseur sur la case active. */
function Case({ char, placeholderChar, isActive, hasFakeCaret }: SlotProps) {
	return (
		<div className={isActive ? `${cases.slot} ${cases.slotActive}` : cases.slot}>
			{char ?? placeholderChar}
			{hasFakeCaret && <span className={cases.caret} />}
		</div>
	)
}
