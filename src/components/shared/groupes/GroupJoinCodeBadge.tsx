"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons"
import styles from "./GroupJoinCodeBadge.module.css"

interface GroupJoinCodeBadgeProps {
    joinCode: string
    /** Image encodée, générée par l'API — absente si le groupe n'a pas de code. */
    qrCodeUrl?: string
}

/**
 * Code de jonction + QR, avec copie en un clic, pour le partager
 * facilement à d'autres apprenants (voir JoinGroupForm/GroupCodeInput
 * côté apprenant, qui valide contre ce même code). Réutilisé par les 3
 * rôles : formateur/gestionnaire (page de détail groupe) et apprenant
 * (GroupHeaderCard, pour inviter des collègues), d'où l'emplacement
 * partagé plutôt que niché sous un rôle précis.
 *
 * Le QR vient de l'API (GET /api/groups/{id}/code-qr). Il encode un lien
 * profond (?code=XXXX-XXXX vers /apprenant/groupes), pas le code brut :
 * scanner rejoint le groupe sans rien retaper (voir
 * app/apprenant/groupes/page.tsx, qui lit ce paramètre). Le lien est bâti
 * côté serveur sur Email:BaseUrl, et non sur l'origine du navigateur, sans
 * quoi un QR affiché en local pointe sur localhost — injoignable depuis un
 * téléphone.
 */
export default function GroupJoinCodeBadge({ joinCode, qrCodeUrl }: GroupJoinCodeBadgeProps) {
    const [isCopied, setIsCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(joinCode)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className={styles.panel}>
            {qrCodeUrl && (
                <img src={qrCodeUrl} alt={`Code QR pour rejoindre le groupe (${joinCode})`} className={styles.qr} />
            )}
            <div className={styles.info}>
                <span className={styles.label}>Code de jonction</span>
                <button type="button" className={styles.codeButton} onClick={handleCopy}>
                    <span className={styles.code}>{joinCode}</span>
                    <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={styles.icon} aria-hidden="true" />
                </button>
                <span className={styles.hint}>Cliquez le code pour le copier, ou faites scanner le QR.</span>
            </div>
        </div>
    )
}