"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { routes } from "@/constants/routes"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StatusBadge from "@/components/ui/StatusBadge"
import Tabs from "@/components/ui/Tabs"
import ManageApprenantGroupsModal from "./ManageApprenantGroupsModal"
import OrganisationContentSection from "./OrganisationContentSection"
import { updateOrganizationName } from "@/_mocks/organizations.actions"
import { setOrganizationActive } from "@/_mocks/organizations.actions"
import { updateMemberRoles, updateMemberOrganization } from "@/_mocksToMigrate/organizationMembers.actions"
import { formatLongDateLabel } from "@/lib/date"
import CategoriesManager from "@/components/shared/CategoriesManager"
import type { Organization } from "@/types/organization"
import type { Category } from "@/types/category"
import type { Group } from "@/types/group"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import type { ContentModule } from "@/types/contentModule"
import type { Role } from "@/constants/roles"
import styles from "./OrganisationDetailView.module.css"

interface OrganisationDetailViewProps {
    organization: Organization
    members: OrganizationMember[]
    allOrganizations: Organization[]
    categories: Category[]
    moduleCounts: Record<string, number>
    groups: Group[]
    adminUserId: string
    /** Supervision Admin — voir OrganisationContentSection.tsx */
    contentModules: ContentModule[]
}

const SIZE_RANGE_LABELS: Record<string, string> = {
    "1-10": "1 à 10 employés",
    "11-50": "11 à 50 employés",
    "51-200": "51 à 200 employés",
    "201-500": "201 à 500 employés",
    "500+": "500+ employés",
}

interface ManageMemberForm {
    isFormateur: boolean
    isGestionnaire: boolean
    targetOrganizationId: string
}

/**
 * Section Membres — points 5/6 de l'épopée Admin (réassigner les rôles,
 * corriger l'affiliation). Appelle updateMemberRoles/
 * updateMemberOrganization (_mocksToMigrate/organizationMembers.actions.ts)
 * — vraie route attendue, repli local silencieux si pas encore construite.
 *
 * CORRECTION : contrairement à ce qu'affirmait ce commentaire avant, les
 * apprenants apparaissent BIEN dans getOrganizationMembers (confirmé en
 * testant) — section "Membres" maintenant à 2 onglets (Personnel /
 * Apprenants) plutôt qu'un seul titre "Membres du personnel" trompeur.
 * Le "Gérer" d'un apprenant (groupes) est distinct de celui du personnel
 * (rôles/org) — voir ManageApprenantGroupsModal.tsx.
 */
export default function OrganisationDetailView({ organization, members, allOrganizations, categories, moduleCounts, groups, adminUserId, contentModules }: OrganisationDetailViewProps) {
    const router = useRouter()
    const isActive = organization.isActive !== false
    const hasActiveGestionnaire = members.some((m) => m.roles.includes("gestionnaire") && m.isActive)

    const [name, setName] = useState(organization.name)
    const [nameError, setNameError] = useState<string | null>(null)
    const [isSavingName, setIsSavingName] = useState(false)
    const [pendingToggle, setPendingToggle] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const [manageTarget, setManageTarget] = useState<OrganizationMember | null>(null)
    const [manageForm, setManageForm] = useState<ManageMemberForm | null>(null)

    const [memberTab, setMemberTab] = useState<"staff" | "apprenants">("staff")
    const [manageApprenantTarget, setManageApprenantTarget] = useState<OrganizationMember | null>(null)

    const staffMembers = members.filter((m) => m.roles.includes("formateur") || m.roles.includes("gestionnaire"))
    const apprenantMembers = members.filter((m) => m.roles.includes("apprenant"))
    const [manageError, setManageError] = useState<string | null>(null)

    async function handleSaveName() {
        setNameError(null)
        setIsSavingName(true)
        try {
            await updateOrganizationName(organization.id, name)
            router.refresh()
        } catch {
            setNameError("Une erreur est survenue.")
        } finally {
            setIsSavingName(false)
        }
    }

    async function handleConfirmToggle() {
        setIsProcessing(true)
        await setOrganizationActive(organization.id, organization.name, !isActive)
        setIsProcessing(false)
        setPendingToggle(false)
        router.refresh()
    }

    function openManageMember(member: OrganizationMember) {
        setManageTarget(member)
        setManageForm({
            isFormateur: member.roles.includes("formateur"),
            isGestionnaire: member.roles.includes("gestionnaire"),
            targetOrganizationId: organization.id,
        })
        setManageError(null)
    }

    async function handleSaveMember() {
        if (!manageTarget || !manageForm) return
        setManageError(null)
        setIsProcessing(true)

        const newRoles: Role[] = []
        if (manageForm.isFormateur) newRoles.push("formateur")
        if (manageForm.isGestionnaire) newRoles.push("gestionnaire")
        if (newRoles.length === 0) {
            setIsProcessing(false)
            setManageError("Un membre doit garder au moins un rôle.")
            return
        }

        const rolesChanged = JSON.stringify([...newRoles].sort()) !== JSON.stringify([...manageTarget.roles].sort())
        const orgChanged = manageForm.targetOrganizationId !== organization.id

        if (rolesChanged) {
            const result = await updateMemberRoles(manageTarget.id, newRoles, organization.id)
            if (!result.success) {
                setIsProcessing(false)
                setManageError(result.error ?? "Une erreur est survenue.")
                return
            }
        }
        if (orgChanged) await updateMemberOrganization(manageTarget.id, manageForm.targetOrganizationId)

        setIsProcessing(false)
        setManageTarget(null)
        setManageForm(null)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <PageHeader title={organization.name} subtitle="Détail de l'organisation" />

            {!hasActiveGestionnaire && (
                <Card padding="md" className={styles.warningBanner}>
                    ⚠️ Aucun gestionnaire actif dans cette organisation — personne ne peut actuellement gérer son
                    contenu ni ses groupes.
                </Card>
            )}

            <Card padding="lg" className={styles.card}>
                <div className={styles.statusRow}>
                    <StatusBadge variant={isActive ? "success" : "neutral"} label={isActive ? "Active" : "Désactivée"} />
                    <Button
                        label={isActive ? "Désactiver" : "Réactiver"}
                        variant="outline"
                        onClick={() => setPendingToggle(true)}
                    />
                </div>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Nom</span>
                    <div className={styles.nameRow}>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
                        <Button
                            label={isSavingName ? "..." : "Enregistrer"}
                            onClick={handleSaveName}
                            disabled={name.trim() === organization.name || !name.trim() || isSavingName}
                        />
                    </div>
                    {nameError && <p className={styles.error}>{nameError}</p>}
                </label>
            </Card>

            <Card padding="lg" className={styles.card}>
                <h2 className={styles.sectionTitle}>Informations</h2>
                <p className={styles.readOnlyHint}>
                    Ces champs ne sont pas encore modifiables — seul le nom l&apos;est pour l&apos;instant.
                </p>

                <div className={styles.infoGrid}>
                    <InfoRow label="Adresse" value={organization.address} />
                    <InfoRow label="Ville" value={organization.city} />
                    <InfoRow label="Province" value={organization.province} />
                    <InfoRow label="Code postal" value={organization.postalCode} />
                    <InfoRow label="Secteur" value={organization.sector} />
                    <InfoRow label="Taille" value={organization.sizeRange ? SIZE_RANGE_LABELS[organization.sizeRange] : undefined} />
                    <InfoRow label="Téléphone" value={organization.phone} />
                    <InfoRow label="Courriel" value={organization.email} />
                    <InfoRow label="Site web" value={organization.website} />
                    <InfoRow
                        label="Créée le"
                        value={organization.createdAt ? formatLongDateLabel(organization.createdAt) : undefined}
                    />
                    <InfoRow label="Abonnement" value={organization.subscriptionStatus === "free" ? "Gratuit" : organization.subscriptionStatus} />
                </div>
            </Card>

            <Card padding="lg" className={styles.card}>
                <div className={styles.membersHeader}>
                    <h2 className={styles.sectionTitle}>Membres</h2>
                    <Link
                        href={`${routes.admin.utilisateurs.root}?org=${organization.id}`}
                        className={styles.utilityLink}
                    >
                        Voir dans Utilisateurs →
                    </Link>
                </div>

                <Tabs
                    items={[
                        { id: "staff", label: `Personnel (${staffMembers.length})` },
                        { id: "apprenants", label: `Apprenants (${apprenantMembers.length})` },
                    ]}
                    active={memberTab}
                    onChange={(id) => setMemberTab(id as "staff" | "apprenants")}
                />

                {memberTab === "staff" ? (
                    staffMembers.length === 0 ? (
                        <p className={styles.readOnlyHint}>Aucun membre du personnel dans cette organisation.</p>
                    ) : (
                        <div className={styles.memberList}>
                            {staffMembers.map((member) => (
                                <div key={member.id} className={styles.memberRowWrapper}>
                                    <Link href={routes.admin.utilisateurs.bySlug(member.id)} className={styles.memberRow}>
                                        <div className={styles.memberInfo}>
                                            <span className={styles.memberName}>{member.fullName}</span>
                                            <span className={styles.memberEmail}>{member.email}</span>
                                        </div>
                                        <span className={styles.memberRoles}>
                                            {member.roles.map((r) => (r === "formateur" ? "Formateur" : "Gestionnaire")).join(" + ")}
                                        </span>
                                    </Link>
                                    <Button label="Gérer" variant="outline" onClick={() => openManageMember(member)} />
                                </div>
                            ))}
                        </div>
                    )
                ) : apprenantMembers.length === 0 ? (
                    <p className={styles.readOnlyHint}>Aucun apprenant dans cette organisation.</p>
                ) : (
                    <div className={styles.memberList}>
                        {apprenantMembers.map((member) => (
                            <div key={member.id} className={styles.memberRowWrapper}>
                                <Link href={routes.admin.utilisateurs.bySlug(member.id)} className={styles.memberRow}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.fullName}</span>
                                        <span className={styles.memberEmail}>{member.email}</span>
                                    </div>
                                </Link>
                                <Button label="Gérer" variant="outline" onClick={() => setManageApprenantTarget(member)} />
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {manageApprenantTarget && (
                <ManageApprenantGroupsModal
                    isOpen={manageApprenantTarget !== null}
                    onClose={() => setManageApprenantTarget(null)}
                    apprenant={manageApprenantTarget}
                    organizationGroups={groups}
                />
            )}

            <Card padding="lg" className={styles.card}>
                <h2 className={styles.sectionTitle}>Groupes ({groups.length})</h2>
                {groups.length === 0 ? (
                    <p className={styles.readOnlyHint}>Aucun groupe dans cette organisation.</p>
                ) : (
                    <div className={styles.memberList}>
                        {groups.map((group) => (
                            <Link key={group.id} href={routes.admin.groupes.bySlug(group.slug)} className={styles.memberRow}>
                                <span className={styles.memberName}>{group.name}</span>
                            </Link>
                        ))}
                    </div>
                )}
                {/* ⚠️ Champs comme le nombre de membres/le formateur contact ne sont pas encore affichés ici — Group n'a pas été revu en détail dans cette session, à enrichir une fois confirmé. */}
            </Card>

            <CategoriesManager
                categories={categories}
                moduleCounts={moduleCounts}
                organizationId={organization.id}
                userId={adminUserId}
                isGestionnaireOfThisOrg
                canCreate={false}
            />

            <OrganisationContentSection
                modules={contentModules}
                organizationId={organization.id}
                organizationName={organization.name}
                adminId={adminUserId}
            />

            <ConfirmDialog
                isOpen={pendingToggle}
                title={isActive ? "Désactiver cette organisation ?" : "Réactiver cette organisation ?"}
                message={
                    isActive
                        ? "Plus personne de cette organisation ne pourra utiliser la plateforme tant qu'elle reste désactivée."
                        : "Les membres de cette organisation retrouveront l'accès à la plateforme."
                }
                confirmLabel={isProcessing ? "..." : isActive ? "Désactiver" : "Réactiver"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmToggle}
                onCancel={() => setPendingToggle(false)}
            />

            <Modal
                isOpen={manageTarget !== null}
                onClose={() => {
                    setManageTarget(null)
                    setManageForm(null)
                }}
                ariaLabel="Gérer ce membre"
                maxWidth={420}
            >
                {manageTarget && manageForm && (
                    <>
                        <h2 className={styles.sectionTitle}>Modifier {manageTarget.fullName}</h2>

                        <div className={styles.checkboxGroup}>
                            <span className={styles.fieldLabel}>Rôles</span>
                            <label className={styles.checkboxField}>
                                <input
                                    type="checkbox"
                                    checked={manageForm.isFormateur}
                                    onChange={(e) => setManageForm({ ...manageForm, isFormateur: e.target.checked })}
                                />
                                <span>Formateur</span>
                            </label>
                            <label className={styles.checkboxField}>
                                <input
                                    type="checkbox"
                                    checked={manageForm.isGestionnaire}
                                    onChange={(e) => setManageForm({ ...manageForm, isGestionnaire: e.target.checked })}
                                />
                                <span>Gestionnaire</span>
                            </label>
                        </div>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Organisation</span>
                            <select
                                className={styles.input}
                                value={manageForm.targetOrganizationId}
                                onChange={(e) => setManageForm({ ...manageForm, targetOrganizationId: e.target.value })}
                            >
                                {allOrganizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.hint}>
                                Change l&apos;organisation seulement si ce membre a été mal assigné à la création.
                            </span>
                        </label>

                        {manageError && <p className={styles.error}>{manageError}</p>}

                        <div className={styles.formActions}>
                            <Button
                                label="Annuler"
                                variant="outline"
                                onClick={() => {
                                    setManageTarget(null)
                                    setManageForm(null)
                                }}
                            />
                            <Button label={isProcessing ? "..." : "Enregistrer"} onClick={handleSaveMember} disabled={isProcessing} />
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value ?? "—"}</span>
        </div>
    )
}