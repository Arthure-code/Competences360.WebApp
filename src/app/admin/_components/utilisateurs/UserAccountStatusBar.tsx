"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StatusBadge from "@/components/ui/StatusBadge"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { setUserAccountActive } from "@/_mocksToMigrate/userAccount.actions"
import styles from "./UserAccountStatusBar.module.css"

interface UserAccountStatusBarProps {
    userId: string
    userName: string
    organizationId: string
    isActive: boolean
}

/**
 * Activer/désactiver vit ici, dans le détail — pas dans la liste de
 * recherche (voir UtilisateursView.tsx), même patron que les
 * organisations (le toggle vit dans le détail d'org, jamais la liste).
 * Rendu juste au-dessus du dossier (ApprenantDossierView/StaffDossierView,
 * composants réels partagés) — pas besoin d'y toucher, ce bandeau reste
 * un élément séparé, propre à Admin.
 */
export default function UserAccountStatusBar({ userId, userName, organizationId, isActive }: UserAccountStatusBarProps) {
    const router = useRouter()
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleConfirm() {
        setIsProcessing(true)
        await setUserAccountActive(userId, userName, organizationId, !isActive)
        setIsProcessing(false)
        setConfirmOpen(false)
        router.refresh()
    }

    return (
        <>
            {!isActive && (
                <div className={styles.deactivatedBanner}>
                    🔒 Ce compte est désactivé — {userName} ne peut plus se connecter à la plateforme.
                </div>
            )}

            <div className={styles.bar}>
                <StatusBadge variant={isActive ? "success" : "neutral"} label={isActive ? "Compte actif" : "Compte désactivé"} />
                <Button label={isActive ? "Désactiver" : "Réactiver"} variant="outline" onClick={() => setConfirmOpen(true)} />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={isActive ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
                message={
                    isActive
                        ? `${userName} ne pourra plus se connecter à la plateforme.`
                        : `${userName} retrouvera l'accès à la plateforme.`
                }
                confirmLabel={isProcessing ? "..." : isActive ? "Désactiver" : "Réactiver"}
                cancelLabel="Annuler"
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    )
}