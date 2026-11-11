"use client"

import { useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleCheck, faCircleXmark, faSpinner } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import { confirmerChangementCourriel, type StatutChangementCourriel } from "@/_mocks/courriel.actions"
import { routes } from "@/constants/routes"
import styles from "./EmailVerificationResult.module.css"

interface EmailChangeResultProps {
    token: string
    adresse: "ancienne" | "nouvelle"
    annuler: boolean
}

type Status = "attente" | "enCours" | StatutChangementCourriel | "error"

/** Explique l'action du lien et ne l'exécute qu'au clic : ouvrir le lien, même par un robot d'analyse, ne change rien. */
export default function EmailChangeResult({ token, adresse, annuler }: EmailChangeResultProps) {
    const [status, setStatus] = useState<Status>("attente")
    const estAnnulation = annuler && adresse === "ancienne"

    async function executer() {
        setStatus("enCours")
        const statut = await confirmerChangementCourriel(token, adresse, annuler)
        setStatus(statut ?? "error")
    }

    if (status === "attente") {
        return (
            <div className={styles.wrapper}>
                <h1 className={styles.title}>
                    {estAnnulation ? "Vous n'avez pas demandé ce changement ?" : "Confirmer votre nouvelle adresse"}
                </h1>
                <p className={styles.message}>
                    {estAnnulation
                        ? "Ce bouton annule la demande, ou rétablit votre adresse si le changement a déjà eu lieu. Toutes les sessions ouvertes sur votre compte seront fermées."
                        : "Cette adresse remplacera celle de votre compte Compétences 360."}
                </p>
                <Button
                    label={estAnnulation ? "Annuler ce changement" : "Confirmer ma nouvelle adresse"}
                    variant={estAnnulation ? "danger" : "primary"}
                    onClick={executer}
                />
            </div>
        )
    }

    if (status === "enCours") {
        return (
            <div className={styles.wrapper}>
                <FontAwesomeIcon icon={faSpinner} className={styles.iconSpinning} aria-hidden="true" />
                <p className={styles.message}>Traitement en cours...</p>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className={styles.wrapper}>
                <FontAwesomeIcon icon={faCircleXmark} className={styles.iconError} aria-hidden="true" />
                <h1 className={styles.title}>Ce lien n'est plus valide</h1>
                <p className={styles.message}>Il a peut-être déjà été utilisé, annulé ou a expiré.</p>
            </div>
        )
    }

    if (status === "annule" || status === "retabli") {
        return (
            <div className={styles.wrapper}>
                <FontAwesomeIcon icon={faCircleCheck} className={styles.iconSuccess} aria-hidden="true" />
                <h1 className={styles.title}>{status === "retabli" ? "Votre adresse est rétablie" : "Demande annulée"}</h1>
                <p className={styles.message}>Toutes les sessions ouvertes ont été fermées. Si quelqu'un d'autre connaît votre mot de passe, changez-le dès votre prochaine connexion, dans Mon compte.</p>
                <Link href={routes.auth.login} className={styles.action}>
                    Aller à la connexion
                </Link>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <FontAwesomeIcon icon={faCircleCheck} className={styles.iconSuccess} aria-hidden="true" />
            <h1 className={styles.title}>Adresse courriel modifiée</h1>
            <p className={styles.message}>Vous pouvez maintenant vous connecter avec votre nouvelle adresse.</p>
            <Link href={routes.auth.login} className={styles.action}>
                Aller à la connexion
            </Link>
        </div>
    )
}
