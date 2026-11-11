"use client"

import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import Button from "@/components/ui/Button"
import Notice from "@/components/shared/Notice"
import { ROLE_LABELS } from "@/constants/roles"
import type { Role } from "@/constants/roles"
import { chargerBrouillon, effacerBrouillon, enregistrerBrouillon } from "@/_mocks/drafts.actions"
import styles from "./InvitationTable.module.css"

interface DraftRow {
    id: string
    email: string
    /** Un seul rôle si "apprenant" (jamais cumulé) ; formateur+gestionnaire peuvent se cumuler sur la même ligne */
    roles: Role[]
}

interface DraftColumn {
    id: string
    groupId: string
}

interface InvitationTableGroup {
    id: string
    name: string
}

export interface InvitationTableInvitee {
    email: string
    roles: Role[]
    groupIds: string[]
}

interface InvitationTableProps {
    /**
     * Rôles sélectionnables, PAR LIGNE — pas un seul rôle pour tout le lot.
     * Un gestionnaire peut donc inviter 10 apprenants, 3 formateurs et 2
     * gestionnaires (dont 1 cumulant formateur+gestionnaire) en un seul
     * envoi, chaque ligne ayant son propre rôle. Le formateur, lui, reçoit
     * ["apprenant"] uniquement (il n'invite que des apprenants) — le
     * sélecteur de rôle par ligne ne s'affiche même pas s'il n'y a qu'un
     * seul rôle permis.
     */
    allowedRoles: Role[]
    availableGroups?: InvitationTableGroup[]
    /** Clé du brouillon enregistré par l'API, différente par contexte (ex. "invitations-draft:formateur") */
    draftStorageKey: string
    /** Rend les messages de refus à afficher — vide quand tout est parti. */
    onSubmit: (invitees: InvitationTableInvitee[]) => Promise<string[]>
}

interface DraftSnapshot {
    rows: DraftRow[]
    columns: DraftColumn[]
    checks: Record<string, string[]>
}

const AVATAR_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4", "#EF4444"]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Couleur déterministe par courriel — le même courriel retombe toujours sur la même couleur, jamais aléatoire entre deux rendus. */
function avatarColorForEmail(email: string): string {
    let hash = 0
    for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const EMPTY_DRAFT: DraftSnapshot = { rows: [], columns: [], checks: {} }

/** Délai avant d'enregistrer le brouillon, pour ne pas appeler l'API à chaque ajout ou coche. */
const DELAI_ENREGISTREMENT_MS = 500

/**
 * Table de travail pour l'invitation en lot — pilotée par config
 * (allowedRoles), pas dupliquée par rôle. Le brouillon, enregistré par
 * l'API, survit à un changement de page, un rafraîchissement ou un autre
 * appareil, pour ne pas perdre une saisie en cours si la personne quitte
 * avant d'envoyer.
 */
export default function InvitationTable({
    allowedRoles,
    availableGroups = [],
    draftStorageKey,
    onSubmit,
}: InvitationTableProps) {
    const hasHydrated = useRef(false)
    const [rows, setRows] = useState<DraftRow[]>([])
    const [columns, setColumns] = useState<DraftColumn[]>([])
    const [checks, setChecks] = useState<Record<string, string[]>>({})
    const [inputValue, setInputValue] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [refus, setRefus] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    const defaultRoles: Role[] = allowedRoles.includes("apprenant") ? ["apprenant"] : [allowedRoles[0]]
    const showRolePicker = allowedRoles.length > 1

    useEffect(() => {
        let annule = false
        hasHydrated.current = false
        chargerBrouillon<DraftSnapshot>(draftStorageKey).then((draft) => {
            if (annule) return
            const snapshot = draft ?? EMPTY_DRAFT
            setRows(snapshot.rows)
            setColumns(snapshot.columns)
            setChecks(snapshot.checks)
            hasHydrated.current = true
        })
        return () => {
            annule = true
        }
    }, [draftStorageKey])

    // Un tableau vidé (envoi réussi ou dernière ligne retirée) efface le brouillon au lieu d'enregistrer un brouillon vide.
    useEffect(() => {
        if (!hasHydrated.current) return
        const minuteur = setTimeout(() => {
            if (rows.length === 0 && columns.length === 0) effacerBrouillon(draftStorageKey)
            else enregistrerBrouillon(draftStorageKey, { rows, columns, checks })
        }, DELAI_ENREGISTREMENT_MS)
        return () => clearTimeout(minuteur)
    }, [draftStorageKey, rows, columns, checks])

    function isChecked(rowId: string, groupId: string): boolean {
        return (checks[rowId] ?? []).includes(groupId)
    }

    function toggleCell(rowId: string, groupId: string) {
        setChecks((prev) => {
            const current = prev[rowId] ?? []
            const next = current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
            return { ...prev, [rowId]: next }
        })
    }

    function toggleColumnAll(groupId: string) {
        const apprenantRows = rows.filter((row) => row.roles.includes("apprenant"))
        const allChecked = apprenantRows.length > 0 && apprenantRows.every((row) => isChecked(row.id, groupId))
        setChecks((prev) => {
            const next = { ...prev }
            apprenantRows.forEach((row) => {
                const current = next[row.id] ?? []
                if (allChecked) {
                    next[row.id] = current.filter((id) => id !== groupId)
                } else if (!current.includes(groupId)) {
                    next[row.id] = [...current, groupId]
                }
            })
            return next
        })
    }

    /**
     * Rôle par ligne — "Apprenant" est exclusif (jamais cumulé, voir
     * types/user.ts), cocher formateur/gestionnaire décoche apprenant
     * automatiquement et vice-versa. Formateur et gestionnaire, eux,
     * peuvent se cumuler librement sur la même ligne.
     */
    function toggleRowRole(rowId: string, role: Role) {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row
                if (role === "apprenant") {
                    const next: Role[] = row.roles.includes("apprenant") ? [] : ["apprenant"]
                    return next.length === 0 ? row : { ...row, roles: next }
                }
                const withoutApprenant = row.roles.filter((r) => r !== "apprenant")
                const next = withoutApprenant.includes(role)
                    ? withoutApprenant.filter((r) => r !== role)
                    : [...withoutApprenant, role]
                return next.length === 0 ? row : { ...row, roles: next }
            })
        )
        // Un rôle staff qui remplace "apprenant" invalide les groupes déjà cochés pour cette ligne — les groupes ne s'appliquent qu'aux apprenants.
        const row = rows.find((r) => r.id === rowId)
        if (row?.roles.includes("apprenant") && role !== "apprenant") {
            setChecks((prev) => ({ ...prev, [rowId]: [] }))
        }
    }

    /**
     * Détecte plusieurs courriels d'un coup — collé (ex. depuis un tableur)
     * ou tapé avec virgule/point-virgule/espace entre chacun — comme le
     * champ "À" de Gmail. Chaque fragment qui ressemble à un courriel
     * devient une puce ; le reste (mal formé, déjà présent) est ignoré
     * silencieusement plutôt que de bloquer tout l'ajout.
     */
    function addEmails(text: string) {
        const candidates = text
            .split(/[,;\s\n]+/)
            .map((fragment) => fragment.trim())
            .filter(Boolean)

        const existing = new Set(rows.map((row) => row.email.toLowerCase()))
        const newRows: DraftRow[] = []
        for (const candidate of candidates) {
            const email = candidate.toLowerCase()
            if (!EMAIL_PATTERN.test(email) || existing.has(email)) continue
            existing.add(email)
            newRows.push({ id: crypto.randomUUID(), email, roles: defaultRoles })
        }
        if (newRows.length > 0) setRows((prev) => [...prev, ...newRows])
    }

    function commitInput() {
        if (!inputValue.trim()) return
        addEmails(inputValue)
        setInputValue("")
    }

    function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter" || event.key === "," || event.key === ";" || event.key === " ") {
            event.preventDefault()
            commitInput()
        } else if (event.key === "Backspace" && inputValue === "" && rows.length > 0) {
            handleRemoveRow(rows[rows.length - 1].id)
        }
    }

    function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = event.clipboardData.getData("text")
        if (/[,;\s\n]/.test(pasted)) {
            event.preventDefault()
            addEmails(pasted)
            setInputValue("")
        }
        // Sinon (un seul fragment collé) : comportement natif, laisse l'input le recevoir normalement.
    }

    function handleRemoveRow(rowId: string) {
        setRows((prev) => prev.filter((row) => row.id !== rowId))
        setChecks((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
        })
    }

    function handleAddColumn(groupId: string) {
        if (!groupId || columns.some((column) => column.groupId === groupId)) return
        setColumns((prev) => [...prev, { id: crypto.randomUUID(), groupId }])
    }

    function handleRemoveColumn(column: DraftColumn) {
        setColumns((prev) => prev.filter((c) => c.id !== column.id))
        setChecks((prev) => {
            const next: Record<string, string[]> = {}
            for (const [rowId, groupIds] of Object.entries(prev)) {
                next[rowId] = groupIds.filter((id) => id !== column.groupId)
            }
            return next
        })
    }

    async function handleSubmit() {
        // Capture tout ce qui traîne dans le champ mais n'a pas encore été validé (Entrée/virgule) — sinon un dernier courriel tapé mais pas confirmé serait silencieusement perdu à l'envoi.
        const pendingText = inputValue.trim()
        const finalRows = pendingText
            ? [
                  ...rows,
                  ...pendingText
                      .split(/[,;\s\n]+/)
                      .map((f) => f.trim().toLowerCase())
                      .filter((email) => EMAIL_PATTERN.test(email) && !rows.some((r) => r.email === email))
                      .map((email) => ({ id: crypto.randomUUID(), email, roles: defaultRoles })),
              ]
            : rows

        setIsSubmitting(true)
        setRefus([])
        const invitees: InvitationTableInvitee[] = finalRows.map((row) => ({
            email: row.email,
            roles: row.roles,
            groupIds: row.roles.includes("apprenant") ? (checks[row.id] ?? []) : [],
        }))
        const messages = await onSubmit(invitees)

        // La saisie est conservée en cas de refus : corriger une adresse ne
        // doit pas obliger à tout retaper.
        if (messages.length > 0) {
            setRefus(messages)
            setIsSubmitting(false)
            return
        }

        setRows([])
        setColumns([])
        setChecks({})
        setInputValue("")
        setIsSubmitting(false)
    }

    const unusedGroups = availableGroups.filter((group) => !columns.some((column) => column.groupId === group.id))
    const apprenantCount = rows.filter((row) => row.roles.includes("apprenant")).length
    const staffCount = rows.length - apprenantCount

    return (
        <div className={styles.wrapper}>
            <div className={styles.chipField} onClick={() => inputRef.current?.focus()}>
                {rows.map((row) => (
                    <span key={row.id} className={styles.chip}>
                        <span className={styles.chipAvatar} style={{ backgroundColor: avatarColorForEmail(row.email) }}>
                            {row.email[0]?.toUpperCase()}
                        </span>
                        <span className={styles.chipEmail}>{row.email}</span>
                        <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={(event) => {
                                event.stopPropagation()
                                handleRemoveRow(row.id)
                            }}
                            aria-label={`Retirer ${row.email}`}
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onPaste={handlePaste}
                    onBlur={commitInput}
                    placeholder={rows.length === 0 ? "Courriels des personnes à inviter — collez-en plusieurs à la fois" : ""}
                    className={styles.chipInput}
                />
            </div>

            {rows.length > 0 && (
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.emailHeader}>Courriel</th>
                                {showRolePicker && <th className={styles.roleHeader}>Rôle(s)</th>}
                                {columns.map((column) => {
                                    const group = availableGroups.find((g) => g.id === column.groupId)
                                    const apprenantRows = rows.filter((row) => row.roles.includes("apprenant"))
                                    const allChecked =
                                        apprenantRows.length > 0 && apprenantRows.every((row) => isChecked(row.id, column.groupId))
                                    return (
                                        <th key={column.id} className={styles.groupHeader}>
                                            <div className={styles.groupHeaderContent}>
                                                <label className={styles.groupHeaderLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={allChecked}
                                                        onChange={() => toggleColumnAll(column.groupId)}
                                                        disabled={apprenantRows.length === 0}
                                                    />
                                                    {group?.name ?? "Groupe"}
                                                </label>
                                                <button
                                                    type="button"
                                                    className={styles.removeColumnButton}
                                                    onClick={() => handleRemoveColumn(column)}
                                                    aria-label={`Retirer la colonne ${group?.name ?? ""}`}
                                                >
                                                    <FontAwesomeIcon icon={faXmark} />
                                                </button>
                                            </div>
                                        </th>
                                    )
                                })}
                                {unusedGroups.length > 0 && (
                                    <th className={styles.addColumnHeader}>
                                        <select
                                            defaultValue=""
                                            onChange={(event) => handleAddColumn(event.target.value)}
                                            className={styles.addColumnSelect}
                                            aria-label="Ajouter une colonne de groupe"
                                        >
                                            <option value="" disabled>
                                                + Ajouter un groupe
                                            </option>
                                            {unusedGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                    </th>
                                )}
                                <th className={styles.actionHeader} />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const isApprenant = row.roles.includes("apprenant")
                                return (
                                    <tr key={row.id}>
                                        <td className={styles.emailCell}>{row.email}</td>
                                        {showRolePicker && (
                                            <td className={styles.roleCell}>
                                                <div className={styles.roleCheckboxes}>
                                                    {allowedRoles.map((role) => (
                                                        <label key={role} className={styles.roleCheckboxLabel}>
                                                            <input
                                                                type="checkbox"
                                                                checked={row.roles.includes(role)}
                                                                onChange={() => toggleRowRole(row.id, role)}
                                                            />
                                                            {ROLE_LABELS[role]}
                                                        </label>
                                                    ))}
                                                </div>
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={column.id} className={styles.checkboxCell}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked(row.id, column.groupId)}
                                                    onChange={() => toggleCell(row.id, column.groupId)}
                                                    disabled={!isApprenant}
                                                    aria-label={`Ajouter ${row.email} à ce groupe`}
                                                />
                                            </td>
                                        ))}
                                        {unusedGroups.length > 0 && <td />}
                                        <td className={styles.actionCell}>
                                            <button
                                                type="button"
                                                className={styles.removeRowButton}
                                                onClick={() => handleRemoveRow(row.id)}
                                                aria-label={`Retirer ${row.email}`}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.footer}>
                <span className={styles.count}>
                    {apprenantCount > 0 && `${apprenantCount} apprenant${apprenantCount > 1 ? "s" : ""}`}
                    {apprenantCount > 0 && staffCount > 0 && ", "}
                    {staffCount > 0 && `${staffCount} membre${staffCount > 1 ? "s" : ""} du personnel`}
                    {rows.length === 0 && "Aucune invitation en attente d'envoi"}
                </span>
                <Button
                    label="Envoyer les invitations"
                    onClick={handleSubmit}
                    disabled={rows.length === 0 || isSubmitting}
                />
            </div>

            {refus.length > 0 && (
                <div role="alert">
                    {refus.map((message) => (
                        <Notice key={message} notice={{ variant: "error", message }} size="sm" />
                    ))}
                </div>
            )}
        </div>
    )
}