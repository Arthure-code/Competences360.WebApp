"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { faUserShield, faCrown, faSitemap } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StatusBadge from "@/components/ui/StatusBadge"
import {
    createAdmin,
    deactivateAdmin,
    reactivateAdmin,
    promoteToOwner,
    demoteToAdmin,
    grantRootStatus,
    removeMyRootStatus,
} from "@/_mocksAdmin/adminAuth.actions"
import { formatLongDateLabel } from "@/lib/date"
import { highlightMatches } from "@/lib/textHighlight"
import { useAdminSearchQuery } from "@/app/admin/_components/AdminSearchContext"
import { getAdminFullName } from "@/lib/adminUser"
import type { AdminUser } from "@/types/adminUser"
import styles from "./AdministrateursView.module.css"

interface AdministrateursViewProps {
    admins: AdminUser[]
    currentAdminId: string
}

interface CreateFormState {
    firstName: string
    lastName: string
    email: string
    password: string
    isOwner: boolean
    isRoot: boolean
}

const EMPTY_CREATE_FORM: CreateFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    isOwner: false,
    isRoot: false,
}

interface ManageFormState {
    role: "admin" | "owner"
    isRoot: boolean
    isActive: boolean
}

interface ManageChange {
    label: string
}

/**
 * Épopée Admin — gestion unifiée par MODAL, pas de boutons inline par
 * ligne (rôle/racine/statut regroupés) — même esprit que le flux
 * d'assignation de modules : "+ Nouvel administrateur" pour créer,
 * "Gérer un administrateur" pour choisir UNE personne (jamais plusieurs
 * à la fois — un changement de rôle/statut a trop d'enjeu individuel
 * pour un geste groupé, contrairement à assigner un module) puis
 * modifier tous ses attributs en un seul formulaire, une seule
 * confirmation récapitulant tous les changements avant d'appliquer.
 *
 * Aucune restriction "jamais sur soi-même" pour rôle/statut — la vraie
 * protection est "dernier propriétaire/racine actif" (voir
 * adminAuth.actions.ts), qui couvre déjà le vrai risque. Le statut racine
 * d'UN AUTRE compte ne peut être qu'ACCORDÉ ici, jamais retiré (seul le
 * titulaire peut retirer son propre statut racine, voir
 * removeMyRootStatus) — sur SA PROPRE ligne, ce même formulaire permet
 * de le retirer.
 */
export default function AdministrateursView({ admins, currentAdminId }: AdministrateursViewProps) {
    const router = useRouter()
    const currentAdmin = admins.find((a) => a.id === currentAdminId)
    const isCurrentOwner = currentAdmin?.isOwner ?? false
    const isCurrentRoot = currentAdmin?.isRoot ?? false

    // Filtre+surligne avec la requête de la topbar (voir AdminSearchContext.tsx) — même mécanique que Journal d'audit/Organisations. Ne touche QUE la liste principale affichée, pas le sélecteur du modal "Gérer un administrateur" (admins.map plus bas), qui doit toujours montrer tout le monde.
    const searchQuery = useAdminSearchQuery()
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const filteredAdmins = normalizedQuery
        ? admins.filter((a) => getAdminFullName(a).toLowerCase().includes(normalizedQuery) || a.email.toLowerCase().includes(normalizedQuery))
        : admins

    const [isCreateOpen, setCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM)
    const [createError, setCreateError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Flux "Gérer un administrateur" — sélection (1 seule personne) puis formulaire, puis confirmation récapitulative.
    const [isPickerOpen, setPickerOpen] = useState(false)
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
    const [manageTarget, setManageTarget] = useState<AdminUser | null>(null)
    const [manageForm, setManageForm] = useState<ManageFormState | null>(null)
    const [pendingChanges, setPendingChanges] = useState<ManageChange[] | null>(null)
    const [manageError, setManageError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleCreate() {
        if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.password) return
        setIsSaving(true)
        setCreateError(null)
        const result = await createAdmin(createForm)
        setIsSaving(false)
        if (!result.success) {
            setCreateError(result.error ?? "Une erreur est survenue.")
            return
        }
        setCreateForm(EMPTY_CREATE_FORM)
        setCreateOpen(false)
        router.refresh()
    }

    function openPicker() {
        setSelectedAdminId(null)
        setPickerOpen(true)
    }

    function handleSelectAndContinue() {
        const target = admins.find((a) => a.id === selectedAdminId)
        if (!target) return
        setPickerOpen(false)
        setManageTarget(target)
        setManageForm({ role: target.isOwner ? "owner" : "admin", isRoot: target.isRoot, isActive: target.isActive })
        setManageError(null)
    }

    function buildChangeSummary(): ManageChange[] {
        if (!manageTarget || !manageForm) return []
        const changes: ManageChange[] = []
        const wasOwner = manageTarget.isOwner
        const wantsOwner = manageForm.role === "owner" || manageForm.isRoot // racine implique toujours propriétaire

        if (wasOwner !== wantsOwner) {
            changes.push({ label: `Rôle : ${wasOwner ? "Propriétaire" : "Administrateur"} → ${wantsOwner ? "Propriétaire" : "Administrateur"}` })
        }
        if (manageTarget.isRoot !== manageForm.isRoot) {
            changes.push({
                label: manageForm.isRoot ? "Devient un compte racine" : "Retire son propre statut racine",
            })
        }
        if (manageTarget.isActive !== manageForm.isActive) {
            changes.push({ label: manageForm.isActive ? "Statut : Désactivé → Actif" : "Statut : Actif → Désactivé" })
        }
        return changes
    }

    function handleReviewChanges() {
        const changes = buildChangeSummary()
        if (changes.length === 0) {
            setManageTarget(null)
            setManageForm(null)
            return
        }
        setPendingChanges(changes)
    }

    async function handleConfirmManage() {
        if (!manageTarget || !manageForm) return
        setIsProcessing(true)
        setManageError(null)

        const wasOwner = manageTarget.isOwner
        const wantsOwner = manageForm.role === "owner" || manageForm.isRoot

        // Ordre : racine d'abord (force propriétaire du même geste si besoin), puis rôle si pas déjà réglé par la racine, puis statut actif/inactif en dernier.
        if (manageForm.isRoot && !manageTarget.isRoot) {
            const result = await grantRootStatus(manageTarget.id)
            if (!result.success) {
                setIsProcessing(false)
                setManageError(result.error ?? "Une erreur est survenue.")
                return
            }
        } else if (!manageForm.isRoot && manageTarget.isRoot && manageTarget.id === currentAdminId) {
            const result = await removeMyRootStatus()
            if (!result.success) {
                setIsProcessing(false)
                setManageError(result.error ?? "Une erreur est survenue.")
                return
            }
        }

        if (wasOwner !== wantsOwner && !(manageForm.isRoot && !manageTarget.isRoot)) {
            // Si grantRootStatus vient de tourner, il a déjà réglé isOwner — pas besoin de promote/demote en plus.
            const result = wantsOwner ? await promoteToOwner(manageTarget.id) : await demoteToAdmin(manageTarget.id)
            if (!result.success) {
                setIsProcessing(false)
                setManageError(result.error ?? "Une erreur est survenue.")
                return
            }
        }

        if (manageTarget.isActive !== manageForm.isActive) {
            const result = manageForm.isActive ? await reactivateAdmin(manageTarget.id) : await deactivateAdmin(manageTarget.id)
            if (!result.success) {
                setIsProcessing(false)
                setManageError(result.error ?? "Une erreur est survenue.")
                return
            }
        }

        setIsProcessing(false)
        setPendingChanges(null)
        setManageTarget(null)
        setManageForm(null)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Administrateurs</h1>
                    <p className={styles.subtitle}>Les comptes ayant accès à la console d&apos;administration.</p>
                </div>
                {isCurrentOwner && (
                    <div className={styles.headerActions}>
                        <Button label="Gérer un administrateur" variant="outline" onClick={openPicker} />
                        <Button label="+ Nouvel administrateur" onClick={() => setCreateOpen(true)} />
                    </div>
                )}
            </div>

            {normalizedQuery && filteredAdmins.length === 0 && (
                <p className={styles.hint}>Aucun administrateur ne correspond à « {searchQuery} ».</p>
            )}

            <div className={styles.list}>
                {filteredAdmins.map((admin) => (
                    <div key={admin.id} className={styles.row}>
                        <div className={styles.rowIcon}>
                            <FontAwesomeIcon icon={admin.isOwner ? faCrown : faUserShield} aria-hidden="true" />
                        </div>
                        <div className={styles.rowInfo}>
                            <span className={styles.rowName}>
                                {highlightMatches(getAdminFullName(admin), searchQuery, styles.highlight)}
                                {admin.id === currentAdminId && <span className={styles.youTag}> (vous)</span>}
                                {admin.isRoot && (
                                    <span className={styles.rootTag} title="Ce compte est un compte racine">
                                        <FontAwesomeIcon icon={faSitemap} /> Racine
                                    </span>
                                )}
                            </span>
                            <span className={styles.rowEmail}>{admin.email}</span>
                            <span className={styles.rowMeta}>Créé le {formatLongDateLabel(admin.createdAt)}</span>
                        </div>

                        <span className={styles.roleTagStatic}>{admin.isOwner ? "Propriétaire" : "Administrateur"}</span>
                        <StatusBadge variant={admin.isActive ? "success" : "neutral"} label={admin.isActive ? "Actif" : "Désactivé"} />
                    </div>
                ))}
            </div>

            {/* Création */}
            <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} ariaLabel="Nouvel administrateur" maxWidth={420}>
                <h2 className={styles.formTitle}>Nouvel administrateur</h2>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Prénom</span>
                    <input
                        type="text"
                        value={createForm.firstName}
                        onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        className={styles.input}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Nom</span>
                    <input
                        type="text"
                        value={createForm.lastName}
                        onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        className={styles.input}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Courriel</span>
                    <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className={styles.input}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Mot de passe initial</span>
                    <input
                        type="text"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className={styles.input}
                    />
                    <span className={styles.hint}>À communiquer à la personne hors de l&apos;app (jamais par courriel).</span>
                </label>

                <label className={styles.checkboxField}>
                    <input
                        type="checkbox"
                        checked={createForm.isOwner || createForm.isRoot}
                        disabled={createForm.isRoot}
                        onChange={(e) => setCreateForm({ ...createForm, isOwner: e.target.checked })}
                    />
                    <span>
                        Faire de cette personne un <strong>Propriétaire</strong> (peut créer/gérer d&apos;autres
                        administrateurs)
                    </span>
                </label>

                {isCurrentRoot && (
                    <label className={styles.checkboxField}>
                        <input
                            type="checkbox"
                            checked={createForm.isRoot}
                            onChange={(e) =>
                                setCreateForm({ ...createForm, isRoot: e.target.checked, isOwner: e.target.checked || createForm.isOwner })
                            }
                        />
                        <span>
                            Faire de cette personne un <strong>Compte racine</strong> (implique Propriétaire — ne peut
                            jamais être désactivé/rétrogradé sauf par lui-même ou un autre compte racine)
                        </span>
                    </label>
                )}

                {createError && <p className={styles.error}>{createError}</p>}

                <div className={styles.formActions}>
                    <Button label="Annuler" variant="outline" onClick={() => setCreateOpen(false)} />
                    <Button
                        label={isSaving ? "Création..." : "Créer"}
                        onClick={handleCreate}
                        disabled={
                            !createForm.firstName.trim() ||
                            !createForm.lastName.trim() ||
                            !createForm.email.trim() ||
                            !createForm.password ||
                            isSaving
                        }
                    />
                </div>
            </Modal>

            {/* Étape 1 — choisir UNE personne */}
            <Modal isOpen={isPickerOpen} onClose={() => setPickerOpen(false)} ariaLabel="Choisir un administrateur" maxWidth={420}>
                <h2 className={styles.formTitle}>Gérer un administrateur</h2>
                <p className={styles.hint}>Choisissez la personne dont vous voulez modifier le rôle ou le statut.</p>
                <div className={styles.pickerList}>
                    {admins.map((admin) => (
                        <label key={admin.id} className={styles.pickerRow}>
                            <input
                                type="radio"
                                name="admin-picker"
                                checked={selectedAdminId === admin.id}
                                onChange={() => setSelectedAdminId(admin.id)}
                            />
                            <span>
                                {getAdminFullName(admin)}
                                {admin.id === currentAdminId && " (vous)"} — {admin.isOwner ? "Propriétaire" : "Administrateur"}
                                {admin.isRoot && " — Racine"}
                            </span>
                        </label>
                    ))}
                </div>
                <div className={styles.formActions}>
                    <Button label="Annuler" variant="outline" onClick={() => setPickerOpen(false)} />
                    <Button label="Continuer" onClick={handleSelectAndContinue} disabled={!selectedAdminId} />
                </div>
            </Modal>

            {/* Étape 2 — formulaire de gestion unifié */}
            <Modal
                isOpen={manageTarget !== null}
                onClose={() => {
                    setManageTarget(null)
                    setManageForm(null)
                }}
                ariaLabel="Modifier cet administrateur"
                maxWidth={420}
            >
                {manageTarget && manageForm && (
                    <>
                        <h2 className={styles.formTitle}>Modifier {getAdminFullName(manageTarget)}</h2>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Rôle</span>
                            <select
                                className={styles.input}
                                value={manageForm.role}
                                disabled={manageForm.isRoot}
                                onChange={(e) => setManageForm({ ...manageForm, role: e.target.value as "admin" | "owner" })}
                            >
                                <option value="admin">Administrateur</option>
                                <option value="owner">Propriétaire</option>
                            </select>
                        </label>

                        {(isCurrentRoot || (manageTarget.id === currentAdminId && manageTarget.isRoot)) && (
                            <label className={styles.checkboxField}>
                                <input
                                    type="checkbox"
                                    checked={manageForm.isRoot}
                                    // Retirer le statut racine n'est permis QUE sur sa propre ligne (voir removeMyRootStatus) — sur la ligne de quelqu'un d'autre, une fois racine, la case reste cochée et désactivée.
                                    disabled={manageTarget.isRoot && manageTarget.id !== currentAdminId}
                                    onChange={(e) =>
                                        setManageForm({
                                            ...manageForm,
                                            isRoot: e.target.checked,
                                            role: e.target.checked ? "owner" : manageForm.role,
                                        })
                                    }
                                />
                                <span>
                                    <strong>Compte racine</strong>
                                    {manageTarget.isRoot && manageTarget.id !== currentAdminId
                                        ? " (seul le titulaire peut retirer ce statut)"
                                        : ""}
                                </span>
                            </label>
                        )}

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Statut</span>
                            <select
                                className={styles.input}
                                value={manageForm.isActive ? "active" : "inactive"}
                                disabled={manageForm.isRoot}
                                onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.value === "active" })}
                            >
                                <option value="active">Actif</option>
                                <option value="inactive">Désactivé</option>
                            </select>
                        </label>

                        {manageForm.isRoot && (
                            <p className={styles.hint}>
                                Un compte racine ne peut pas être désactivé ni rétrogradé par cette console — seul le
                                titulaire peut retirer son propre statut racine d&apos;abord.
                            </p>
                        )}

                        <div className={styles.formActions}>
                            <Button
                                label="Annuler"
                                variant="outline"
                                onClick={() => {
                                    setManageTarget(null)
                                    setManageForm(null)
                                }}
                            />
                            <Button label="Continuer" onClick={handleReviewChanges} />
                        </div>
                    </>
                )}
            </Modal>

            {/* Étape 3 — confirmation récapitulative */}
            <ConfirmDialog
                isOpen={pendingChanges !== null}
                title={`Confirmer les changements pour ${manageTarget ? getAdminFullName(manageTarget) : ""} ?`}
                message={
                    manageError
                        ? manageError
                        : pendingChanges
                          ? pendingChanges.map((c) => c.label).join(" — ")
                          : ""
                }
                confirmLabel={isProcessing ? "..." : "Confirmer"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmManage}
                onCancel={() => {
                    setPendingChanges(null)
                    setManageError(null)
                }}
            />
        </div>
    )
}