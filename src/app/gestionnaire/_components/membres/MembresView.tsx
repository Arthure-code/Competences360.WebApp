"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { faUsers } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import EmptyState from "@/components/ui/EmptyState"
import SentInvitationsList from "@/components/shared/SentInvitationsList"
import InvitationTable, { type InvitationTableInvitee } from "@/components/shared/InvitationTable"
import MemberRow from "@/app/gestionnaire/_components/membres/MemberRow"
import { sendInvitations, cancelInvitation } from "@/_mocks/invitations.actions"
import { routes } from "@/constants/routes"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import type { Invitation } from "@/types/invitation"
import styles from "./MembresView.module.css"

interface MembresViewProps {
    members: OrganizationMember[]
    invitations: Invitation[]
    groups: { id: string; name: string }[]
    organizationId: string
    userId: string
}

type TabId = "apprenants" | "formateurs" | "gestionnaires" | "invitations"

/**
 * Épopée 17 — chaque ligne mène maintenant au bon dossier complet selon
 * le rôle : un apprenant vers routes.gestionnaire.apprenants, un
 * formateur/gestionnaire vers routes.gestionnaire.staff (voir
 * getMemberHref ci-dessous) — auparavant aucun lien, cliquer ne faisait
 * rien.
 *
 * Classé par rôle plutôt qu'une liste "Membres" mélangée — plus scannable
 * (même principe que le regroupement par catégorie ailleurs dans l'app).
 * Un membre avec 2 rôles (ex. formateur+gestionnaire) apparaît dans les 2
 * onglets concernés, pas dupliqué en trichant sur le compte — c'est
 * l'exacte réalité de son cumul.
 *
 * Un seul mécanisme d'invitation (InvitationTable) — le rôle se choisit
 * maintenant PAR LIGNE dans le tableau lui-même (voir
 * InvitationTable.tsx), donc un seul envoi peut couvrir 10 apprenants, 3
 * formateurs et 2 gestionnaires (dont 1 cumulant les deux), sans avoir à
 * refaire l'opération par rôle.
 */
export default function MembresView({ members, invitations, groups, organizationId, userId }: MembresViewProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const TAB_IDS: readonly TabId[] = ["apprenants", "formateurs", "gestionnaires", "invitations"]
    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const param = searchParams.get("onglet")
        return param && (TAB_IDS as readonly string[]).includes(param) ? (param as TabId) : "apprenants"
    })

    const apprenants = members.filter((m) => m.roles.includes("apprenant"))
    const formateurs = members.filter((m) => m.roles.includes("formateur"))
    const gestionnaires = members.filter((m) => m.roles.includes("gestionnaire"))

    const tabs = [
        { id: "apprenants", label: `Apprenants (${apprenants.length})` },
        { id: "formateurs", label: `Formateurs (${formateurs.length})` },
        { id: "gestionnaires", label: `Gestionnaires (${gestionnaires.length})` },
        { id: "invitations", label: `Invitations (${invitations.length})` },
    ] as const

    const membersByTab: Record<Exclude<TabId, "invitations">, OrganizationMember[]> = {
        apprenants,
        formateurs,
        gestionnaires,
    }

    /**
     * Apprenant -> son dossier apprenant (progression, moments forts...).
     * Formateur et/ou gestionnaire -> son dossier staff (groupes gérés,
     * contenu créé...). Un membre ne cumule jamais apprenant avec un
     * autre rôle (voir types/user.ts) — priorité staff arbitraire ici
     * seulement en théorie, jamais en pratique avec les données actuelles.
     */
    function getMemberHref(member: OrganizationMember): string {
        if (member.roles.includes("formateur") || member.roles.includes("gestionnaire")) {
            return routes.gestionnaire.staff.bySlug(member.id)
        }
        return routes.gestionnaire.apprenants.bySlug(member.id)
    }

    async function handleBatchSubmit(invitees: InvitationTableInvitee[]) {
        const resultat = await sendInvitations(
            invitees.map((invitee) => ({
                email: invitee.email,
                roles: invitee.roles,
                organizationId,
                groupIds: invitee.groupIds,
                invitedByUserId: userId,
            }))
        )
        router.refresh()
        return resultat.erreurs
    }

    async function handleCancelInvitation(invitationId: string) {
        await cancelInvitation(invitationId)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Membres"
                subtitle="Tous les formateurs, gestionnaires et apprenants de l'organisation."
            />

            <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

            {activeTab === "invitations" ? (
                <div className={styles.invitationsTab}>
                    <div className={styles.batchSection}>
                        <h2 className={styles.batchTitle}>Inviter</h2>
                        <p className={styles.batchHint}>
                            Une ou plusieurs personnes à la fois, chacune avec son propre rôle.
                        </p>
                        <InvitationTable
                            allowedRoles={["apprenant", "formateur", "gestionnaire"]}
                            availableGroups={groups}
                            draftStorageKey="invitations-draft:gestionnaire"
                            onSubmit={handleBatchSubmit}
                        />
                    </div>

                    {invitations.length === 0 ? (
                        <EmptyState icon={faUsers} title="Aucune invitation en attente." bordered />
                    ) : (
                        <SentInvitationsList invitations={invitations} onCancel={handleCancelInvitation} />
                    )}
                </div>
            ) : membersByTab[activeTab].length === 0 ? (
                <EmptyState icon={faUsers} title="Personne dans cette catégorie pour l'instant." bordered />
            ) : (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <span>Nom</span>
                        <span>Rôle</span>
                        <span>Statut</span>
                    </div>
                    {membersByTab[activeTab].map((member) => (
                        <MemberRow key={member.id} member={member} href={getMemberHref(member)} />
                    ))}
                </div>
            )}
        </div>
    )
}