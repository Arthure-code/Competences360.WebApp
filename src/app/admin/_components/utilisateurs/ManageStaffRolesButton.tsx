"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { updateMemberRoles, updateMemberOrganization } from "@/_mocksToMigrate/organizationMembers.actions"
import type { Role } from "@/constants/roles"
import type { Organization } from "@/types/organization"
import styles from "./ManageStaffRolesButton.module.css"

interface ManageStaffRolesButtonProps {
    userId: string
    userName: string
    currentRoles: Role[]
    currentOrganizationId: string
    allOrganizations: Organization[]
}

/**
 * Même logique que le modal "Gérer" de OrganisationDetailView.tsx
 * (rôles + réassignation org), reconstruite ici de façon autonome pour
 * la page dossier — pas d'extraction en composant partagé pour l'instant
 * (risque de casser le flux existant déjà en place), un peu de
 * duplication acceptée consciemment plutôt qu'un refactor risqué.
 */
export default function ManageStaffRolesButton({
    userId,
    userName,
    currentRoles,
    currentOrganizationId,
    allOrganizations,
}: ManageStaffRolesButtonProps) {
    const router = useRouter()
    const [isOpen, setOpen] = useState(false)
    const [isFormateur, setIsFormateur] = useState(currentRoles.includes("formateur"))
    const [isGestionnaire, setIsGestionnaire] = useState(currentRoles.includes("gestionnaire"))
    const [targetOrganizationId, setTargetOrganizationId] = useState(currentOrganizationId)
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    function openModal() {
        setIsFormateur(currentRoles.includes("formateur"))
        setIsGestionnaire(currentRoles.includes("gestionnaire"))
        setTargetOrganizationId(currentOrganizationId)
        setError(null)
        setOpen(true)
    }

    async function handleSave() {
        setError(null)
        setIsProcessing(true)

        const newRoles: Role[] = []
        if (isFormateur) newRoles.push("formateur")
        if (isGestionnaire) newRoles.push("gestionnaire")
        if (newRoles.length === 0) {
            setIsProcessing(false)
            setError("Un membre doit garder au moins un rôle.")
            return
        }

        const rolesChanged = JSON.stringify([...newRoles].sort()) !== JSON.stringify([...currentRoles].sort())
        const orgChanged = targetOrganizationId !== currentOrganizationId

        if (rolesChanged) {
            const result = await updateMemberRoles(userId, newRoles, currentOrganizationId)
            if (!result.success) {
                setIsProcessing(false)
                setError(result.error ?? "Une erreur est survenue.")
                return
            }
        }
        if (orgChanged) await updateMemberOrganization(userId, targetOrganizationId)

        setIsProcessing(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <>
            <Button label="Gérer" variant="outline" onClick={openModal} />

            <Modal isOpen={isOpen} onClose={() => setOpen(false)} ariaLabel="Gérer ce membre" maxWidth={420}>
                <h2 className={styles.title}>Modifier {userName}</h2>

                <div className={styles.checkboxGroup}>
                    <span className={styles.fieldLabel}>Rôles</span>
                    <label className={styles.checkboxField}>
                        <input type="checkbox" checked={isFormateur} onChange={(e) => setIsFormateur(e.target.checked)} />
                        <span>Formateur</span>
                    </label>
                    <label className={styles.checkboxField}>
                        <input type="checkbox" checked={isGestionnaire} onChange={(e) => setIsGestionnaire(e.target.checked)} />
                        <span>Gestionnaire</span>
                    </label>
                </div>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Organisation</span>
                    <select
                        className={styles.input}
                        value={targetOrganizationId}
                        onChange={(e) => setTargetOrganizationId(e.target.value)}
                    >
                        {allOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                                {org.name}
                            </option>
                        ))}
                    </select>
                    <span className={styles.hint}>Change l&apos;organisation seulement si ce membre a été mal assigné à la création.</span>
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button label="Annuler" variant="outline" onClick={() => setOpen(false)} />
                    <Button label={isProcessing ? "..." : "Enregistrer"} onClick={handleSave} disabled={isProcessing} />
                </div>
            </Modal>
        </>
    )
}
