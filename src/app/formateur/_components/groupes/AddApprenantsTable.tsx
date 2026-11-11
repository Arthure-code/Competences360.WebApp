"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faClock } from "@fortawesome/free-solid-svg-icons"
import InvitationTable, { type InvitationTableInvitee } from "@/components/shared/InvitationTable"
import { getUserByEmail } from "@/_mocks/users.mock"
import { addGroupMembership } from "@/_mocks/groupMemberships.actions"
import { sendInvitations } from "@/_mocks/invitations.actions"
import styles from "./AddApprenantsTable.module.css"

interface AddApprenantsTableProps {
    groupId: string
    organizationId: string
    invitedByUserId: string
}

interface RowResult {
    email: string
    status: "added" | "invited"
}

/**
 * Même mécanique de saisie que partout ailleurs où on invite/ajoute des
 * gens (InvitationTable — puces, collage multi-courriels) plutôt qu'une
 * saisie ligne par ligne dédiée à ce composant. allowedRoles=["apprenant"]
 * : un seul rôle possible ici (on ajoute à UN groupe précis), donc la
 * colonne de rôle par ligne ne s'affiche même pas.
 *
 * Compte existant (voir getUserByEmail, illustratif) -> ajout immédiat au
 * groupe (addGroupMembership). Sans compte -> invitation réelle
 * (sendInvitations, groupIds pré-rempli avec CE groupe) — logique
 * inchangée, juste la saisie qui est unifiée.
 */
export default function AddApprenantsTable({ groupId, organizationId, invitedByUserId }: AddApprenantsTableProps) {
    const router = useRouter()
    const [results, setResults] = useState<RowResult[] | null>(null)

    async function handleSubmit(invitees: InvitationTableInvitee[]) {
        const rowResults: RowResult[] = []
        const toInvite: string[] = []

        for (const invitee of invitees) {
            const existingUser = await getUserByEmail(invitee.email)
            if (existingUser) {
                await addGroupMembership(groupId, existingUser.id)
                rowResults.push({ email: invitee.email, status: "added" })
            } else {
                toInvite.push(invitee.email)
            }
        }

        let erreurs: string[] = []

        if (toInvite.length > 0) {
            const resultat = await sendInvitations(
                toInvite.map((email) => ({
                    email,
                    roles: ["apprenant"],
                    organizationId,
                    groupIds: [groupId],
                    invitedByUserId,
                }))
            )

            const invitees = new Set(resultat.created.map((invitation) => invitation.email))
            toInvite
                .filter((email) => invitees.has(email))
                .forEach((email) => rowResults.push({ email, status: "invited" }))

            erreurs = resultat.erreurs
        }

        setResults(rowResults)
        router.refresh()
        return erreurs
    }

    return (
        <div className={styles.wrapper}>
            <h3 className={styles.title}>Ajouter des apprenants</h3>
            <p className={styles.hint}>
                Un compte existant est ajouté immédiatement. Sans compte, une invitation par courriel est envoyée.
            </p>

            <InvitationTable
                allowedRoles={["apprenant"]}
                draftStorageKey={`add-apprenants-draft:${groupId}`}
                onSubmit={handleSubmit}
            />

            {results && results.length > 0 && (
                <div className={styles.results}>
                    {results.map((result, index) => (
                        <div key={index} className={styles.resultRow}>
                            <FontAwesomeIcon
                                icon={result.status === "added" ? faCheck : faClock}
                                className={result.status === "added" ? styles.resultAdded : styles.resultInvited}
                            />
                            <span className={styles.resultEmail}>{result.email}</span>
                            <span className={styles.resultLabel}>
                                {result.status === "added" ? "Ajouté" : "En attente — invitation envoyée"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}