"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import { lireMesPreferences, changerMaLangue } from "@/_mocks/preferences.actions"
import styles from "./LanguageCard.module.css"

/**
 * Commun à tous les rôles. La langue est persistée sur le compte
 * (`PUT /api/preferences`) : c'était un `useState` isolé, qui revenait au
 * français dès le rechargement.
 *
 * Le serveur n'accepte que « fr » et « en » — liste fermée de son côté, pas
 * du nôtre. Seul « fr » est proposé ici tant que les traductions anglaises
 * n'existent pas.
 */
export default function LanguageCard() {
	const [language, setLanguage] = useState("fr")
	const [erreur, setErreur] = useState<string | null>(null)

	useEffect(() => {
		let annule = false

		void lireMesPreferences().then((preferences) => {
			if (!annule) setLanguage(preferences.preferredLanguage)
		})

		return () => {
			annule = true
		}
	}, [])

	async function handleChange(valeur: string) {
		setErreur(null)

		const resultat = await changerMaLangue(valeur)

		if (!resultat.succes) {
			setErreur(resultat.erreur ?? "Le changement de langue a échoué.")
			return
		}

		setLanguage(valeur)
	}

	return (
		<Card padding="lg" className={styles.card}>
			<PageSubheader title="Langue" />
			<select
				value={language}
				onChange={(e) => handleChange(e.target.value)}
				className={styles.select}
			>
				<option value="fr">Français</option>
			</select>
			{erreur && <p role="alert">{erreur}</p>}
		</Card>
	)
}