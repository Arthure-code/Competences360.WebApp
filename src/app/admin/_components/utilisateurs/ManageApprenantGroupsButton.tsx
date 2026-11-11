"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ManageApprenantGroupsModal from "@/app/admin/_components/organisations/ManageApprenantGroupsModal"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import type { Group } from "@/types/group"

interface ManageApprenantGroupsButtonProps {
    apprenant: OrganizationMember
    organizationGroups: Group[]
}

/** Réutilise ManageApprenantGroupsModal tel quel (déjà construit pour le détail d'org) — juste un bouton autonome pour la page dossier. */
export default function ManageApprenantGroupsButton({ apprenant, organizationGroups }: ManageApprenantGroupsButtonProps) {
    const [isOpen, setOpen] = useState(false)

    return (
        <>
            <Button label="Gérer" variant="outline" onClick={() => setOpen(true)} />
            <ManageApprenantGroupsModal
                isOpen={isOpen}
                onClose={() => setOpen(false)}
                apprenant={apprenant}
                organizationGroups={organizationGroups}
            />
        </>
    )
}
