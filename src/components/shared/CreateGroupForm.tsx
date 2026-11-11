"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { createGroup } from "@/_mocks/groups.actions"
import { routes } from "@/constants/routes"
import type { GroupContact, GroupContactRole } from "@/types/group"
import styles from "./CreateGroupForm.module.css"

interface AvailableContact {
    id: string
    fullName: string
    email: string
    roles: GroupContactRole[]
}

interface CreateGroupFormProps {
    userId: string
    userFullName: string
    userEmail: string
    userRoles: GroupContactRole[]
    organizationId: string
    role: "formateur" | "gestionnaire"
    /**
     * Présent seulement côté gestionnaire — la liste des formateurs
     * assignables comme contact du groupe. Absent côté formateur : il est
     * toujours son propre contact, pas de sens à se choisir lui-même dans
     * une liste. createGroup (groups.actions.ts) acceptait déjà n'importe
     * quel GroupContact — le vrai trou était ici, pas dans l'action.
     */
    availableContacts?: AvailableContact[]
}

const GROUP_NAME_MAX_LENGTH = 80

/**
 * Partagé entre formateur et gestionnaire — createGroup lui-même est déjà
 * générique (accepte n'importe quel GroupContact). Formateur n'a pas de
 * sélecteur (toujours lui-même) ; gestionnaire choisit qui devient le
 * contact du groupe, potentiellement quelqu'un d'autre que lui-même.
 */
export default function CreateGroupForm({
    userId,
    userFullName,
    userEmail,
    userRoles,
    organizationId,
    role,
    availableContacts,
}: CreateGroupFormProps) {
    const router = useRouter()
    const [name, setName] = useState("")
    const [contactId, setContactId] = useState(userId)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmedName = name.trim()
        if (!trimmedName) {
            setError("Le nom du groupe est requis.")
            return
        }
        setError(null)
        setIsCreating(true)

        const selfContact: GroupContact = { id: userId, fullName: userFullName, email: userEmail, roles: userRoles }
        const matchedContact = availableContacts?.find((c) => c.id === contactId)
        const selectedContact: GroupContact = matchedContact
            ? { id: matchedContact.id, fullName: matchedContact.fullName, email: matchedContact.email, roles: matchedContact.roles }
            : selfContact

        const group = await createGroup({
            name: trimmedName,
            organizationId,
            contact: selectedContact,
        })

        router.push(routes[role].groupes.bySlug(group.slug))
    }

    return (
        <div className={styles.page}>
            <Link href={routes[role].groupes.root} className={styles.backLink}>
                <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                Retour aux groupes
            </Link>

            <PageHeader
                title="Créer un groupe"
                subtitle="Un code de jonction sera généré automatiquement pour permettre à vos apprenants de le rejoindre en libre-service."
            />

            <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.field}>
                    <span className={styles.label}>Nom du groupe</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        placeholder="Ex. Hôtel Boréal — Service à la clientèle"
                        maxLength={GROUP_NAME_MAX_LENGTH}
                        autoFocus
                    />
                    <span className={styles.charCount}>
                        {name.length}/{GROUP_NAME_MAX_LENGTH}
                    </span>
                </label>

                {availableContacts && availableContacts.length > 0 && (
                    <label className={styles.field}>
                        <span className={styles.label}>Contact du groupe</span>
                        <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={styles.select}>
                            <option value={userId}>{userFullName} (vous)</option>
                            {availableContacts
                                .filter((c) => c.id !== userId)
                                .map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName}
                                    </option>
                                ))}
                        </select>
                    </label>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button
                        label={isCreating ? "Création..." : "Créer le groupe"}
                        type="submit"
                        disabled={isCreating}
                    />
                </div>
            </form>
        </div>
    )
}