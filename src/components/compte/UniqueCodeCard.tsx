"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import styles from "./UniqueCodeCard.module.css"

interface UniqueCodeCardProps {
    code: string
}

/** Spécifique au profil apprenant — rendu conditionnellement seulement si apprenantProfile existe sur la session. */
export default function UniqueCodeCard({ code }: UniqueCodeCardProps) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Presse-papiers indisponible (permissions/contexte non sécurisé) — pas de repli nécessaire
        }
    }

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader
                title="Mon code unique"
                subtitle="Communiquez ce code à votre formateur ou un membre de votre organisation, s'il a besoin de vous identifier."
            />
            <button type="button" className={styles.codeBox} onClick={handleCopy}>
                <span className={styles.code}>{code}</span>
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={styles.copyIcon} aria-hidden="true" />
            </button>
        </Card>
    )
}