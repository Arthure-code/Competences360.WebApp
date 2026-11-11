"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import JoinGroupForm, { type GroupCodeTab } from "@/components/shared/JoinGroupForm"
import { rejoindreGroupeParCode } from "@/_mocks/groupJoin.actions"
import styles from "./JoinGroupModal.module.css"

interface JoinGroupModalProps {
    isOpen: boolean
    onClose: () => void
    /** Pré-rempli ET soumis automatiquement quand on arrive via un lien de QR code (voir GroupJoinCodeBadge.tsx, ?code= dans l'URL) — scanner doit équivaloir à taper le code et cliquer Rejoindre, pas juste pré-remplir en attendant un clic de plus */
    initialCode?: string
}

/**
 * Réutilise JoinGroupForm (déjà prévu pour ce cas précis, voir son
 * commentaire "futur modal + Rejoindre un groupe") plutôt qu'une page
 * dédiée à /apprenant/groupes/rejoindre, qui n'existe pas. Juste le
 * formulaire, pas toute la mise en page de GroupsEmptyState (icône,
 * bénéfices) : redondant pour quelqu'un qui a déjà des groupes et veut
 * seulement en ajouter un.
 */
export default function JoinGroupModal({ isOpen, onClose, initialCode = "" }: JoinGroupModalProps) {
    const router = useRouter()
    const [tab, setTab] = useState<GroupCodeTab>("code")
    const [code, setCode] = useState(initialCode)
    const [error, setError] = useState<string | null>(null)
    const [enCours, setEnCours] = useState(false)

    /**
     * C'est le SERVEUR qui valide le code : il retrouve le groupe, vérifie
     * l'échéance et rattache l'apprenant. Le formulaire ne fait que
     * transmettre la saisie.
     *
     * L'appel est idempotent — scanner deux fois le même code QR rend
     * « déjà membre », pas une erreur.
     */
    async function handleSubmit(submittedCode: string) {
        if (!submittedCode.trim() || enCours) return

        setEnCours(true)
        setError(null)

        const adhesion = await rejoindreGroupeParCode(submittedCode)

        if (!adhesion.succes) {
            setError(adhesion.erreur ?? "Ce code est invalide ou expiré. Vérifiez avec votre formateur.")
            setEnCours(false)
            return
        }

        setEnCours(false)
        setCode("")
        onClose()
        router.refresh()
    }

    // Un seul déclenchement, au montage, pas à chaque changement de code tapé manuellement ensuite.
    useEffect(() => {
        if (initialCode) handleSubmit(initialCode)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleClose() {
        setCode("")
        setError(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} ariaLabel="Rejoindre un groupe">
            <h2 className={styles.title}>Rejoindre un groupe</h2>
            <JoinGroupForm
                activeTab={tab}
                onTabChange={setTab}
                code={code}
                onCodeChange={(value) => {
                    setCode(value)
                    setError(null)
                }}
                error={error}
                submit={{ label: "Rejoindre mon groupe", onSubmit: () => handleSubmit(code) }}
            />
        </Modal>
    )
}