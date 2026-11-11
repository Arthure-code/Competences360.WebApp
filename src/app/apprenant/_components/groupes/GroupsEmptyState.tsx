"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUserGroup, faBookOpen, faChartLine, faBell } from "@fortawesome/free-solid-svg-icons"
import EmptyState from "@/components/ui/EmptyState"
import Card from "@/components/ui/Card"
import JoinGroupForm, { type GroupCodeTab } from "@/components/shared/JoinGroupForm"
import { rejoindreGroupeParCode } from "@/_mocks/groupJoin.actions"
import styles from "./GroupsEmptyState.module.css"

// Contenu du bloc "bénéfices" — data-driven plutôt que 3 blocs dupliqués en dur.
const BENEFITS = [
    {
        icon: faBookOpen,
        title: "Modules assignés",
        description: "Accédez directement aux cours prévus pour vous.",
    },
    {
        icon: faChartLine,
        title: "Suivi personnalisé",
        description: "Bénéficiez d'un accompagnement sur mesure.",
    },
    {
        icon: faBell,
        title: "Rappels automatiques",
        description: "Ne manquez plus aucune échéance importante.",
    },
]

interface GroupsEmptyStateProps {
    /** Pré-rempli si arrivé via un lien de QR code (voir GroupJoinCodeBadge.tsx, ?code= dans l'URL) */
    initialCode?: string
}

export default function GroupsEmptyState({ initialCode = "" }: GroupsEmptyStateProps) {
    const router = useRouter()
    const [tab, setTab] = useState<GroupCodeTab>("code")
    const [code, setCode] = useState(initialCode)
    const [error, setError] = useState<string | null>(null)
    const [enCours, setEnCours] = useState(false)

    /**
     * Validation côté SERVEUR — voir `_mocks/groupJoin.actions.ts`. Un
     * rafraîchissement suffit à faire disparaître cet écran vide : la page
     * relit alors les groupes et affiche le nouveau.
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
        router.refresh()
    }

    // Un seul déclenchement, au montage, pas à chaque changement de code tapé manuellement ensuite — scanner doit équivaloir à taper le code et cliquer Rejoindre, pas juste pré-remplir en attendant un clic de plus.
    useEffect(() => {
        if (initialCode) handleSubmit(initialCode)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={styles.wrapper}>
            <EmptyState
                icon={faUserGroup}
                title="Vous ne faites partie d'aucun groupe"
                description="Un formateur peut vous assigner des modules et suivre votre progression. Choisissez l'une des méthodes ci-dessous pour rejoindre un groupe et commencer votre apprentissage."
            />

            <Card padding="lg" className={styles.formCard}>
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
            </Card>

            <div className={styles.benefits}>
                {BENEFITS.map((benefit) => (
                    <div key={benefit.title} className={styles.benefit}>
                        <FontAwesomeIcon icon={benefit.icon} className={styles.benefitIcon} aria-hidden="true" />
                        <p className={styles.benefitTitle}>{benefit.title}</p>
                        <p className={styles.benefitDescription}>{benefit.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}