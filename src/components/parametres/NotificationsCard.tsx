"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import Toggle from "@/components/ui/Toggle"
import styles from "./NotificationsCard.module.css"

export interface NotificationPref {
    id: string
    label: string
    description: string
    defaultChecked: boolean
}

export const APPRENANT_NOTIFICATION_PREFS: NotificationPref[] = [
    {
        id: "modules-assigned",
        label: "Modules assignés",
        description: "Être notifié quand un nouveau module m'est assigné",
        defaultChecked: true,
    },
    {
        id: "deadline-reminders",
        label: "Rappels de dates limites",
        description: "Recevoir des rappels J-7, J-3 et J-1 avant une échéance",
        defaultChecked: true,
    },
    {
        id: "achievements",
        label: "Badges, certificats et moments forts",
        description: "Être notifié quand j'obtiens une récompense",
        defaultChecked: false,
    },
]

export const FORMATEUR_NOTIFICATION_PREFS: NotificationPref[] = [
    {
        id: "apprenant-joined",
        label: "Nouvel apprenant",
        description: "Être notifié quand un apprenant rejoint un de mes groupes",
        defaultChecked: true,
    },
    {
        id: "invitation-accepted",
        label: "Invitations",
        description: "Être notifié quand une invitation envoyée est acceptée",
        defaultChecked: true,
    },
    {
        id: "content-sent-back",
        label: "Révision de contenu",
        description: "Être notifié quand un gestionnaire renvoie une de mes versions en brouillon",
        defaultChecked: true,
    },
]

export const GESTIONNAIRE_NOTIFICATION_PREFS: NotificationPref[] = [
    {
        id: "pending-review",
        label: "À réviser",
        description: "Être notifié quand un nouveau module attend une révision",
        defaultChecked: true,
    },
    {
        id: "pending-invitations",
        label: "Invitations en attente",
        description: "Être notifié quand une invitation reste sans réponse plus de 7 jours",
        defaultChecked: true,
    },
    {
        id: "orphaned-content",
        label: "Contenu orphelin",
        description: "Être notifié quand du contenu officiel appartient à un compte désactivé",
        defaultChecked: false,
    },
]

interface NotificationsCardProps {
    prefs: NotificationPref[]
}

/**
 * Pilotée par données, pas de rôle codé en dur ici — chaque page.tsx
 * fournit la liste qui lui correspond (APPRENANT_/FORMATEUR_/GESTIONNAIRE_
 * NOTIFICATION_PREFS ci-dessus), au lieu d'une branche conditionnelle par
 * rôle dans ce composant.
 */
export default function NotificationsCard({ prefs: prefsList }: NotificationsCardProps) {
    const [prefs, setPrefs] = useState<Record<string, boolean>>(
        Object.fromEntries(prefsList.map((pref) => [pref.id, pref.defaultChecked])),
    )

    return (
        <Card padding="lg" className={styles.card}>
            <PageSubheader title="Notifications" subtitle="Gérez comment vous souhaitez être informé." />

            <div className={styles.list}>
                {prefsList.map((pref) => (
                    <div key={pref.id} className={styles.item}>
                        <div className={styles.itemText}>
                            <p className={styles.itemLabel}>{pref.label}</p>
                            <p className={styles.itemDescription}>{pref.description}</p>
                        </div>
                        <Toggle
                            checked={prefs[pref.id]}
                            onChange={(checked) => setPrefs((prev) => ({ ...prev, [pref.id]: checked }))}
                            label={pref.label}
                        />
                    </div>
                ))}
            </div>
        </Card>
    )
}