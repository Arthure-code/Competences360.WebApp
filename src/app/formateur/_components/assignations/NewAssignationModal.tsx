"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { createAssignment } from "@/_mocks/assignments.actions"
import { getOverriddenGroupAssignment } from "@/lib/assignedModules"
import type { AssignableModule } from "../../../../components/shared/AssignationsView"
import styles from "./NewAssignationModal.module.css"

interface NewAssignationModalProps {
    isOpen: boolean
    onClose: () => void
    assignableModules: AssignableModule[]
    groups: { id: string; name: string }[]
    apprenants: { userId: string; fullName: string }[]
    userId: string
}

type TargetType = "group" | "apprenant"
type ScopeType = "module" | "niveau"

/**
 * N'importe quelle version PUBLIÉE de l'org peut être assignée, pas
 * seulement l'officielle ("publier" sert justement à permettre ça entre
 * collègues). Choisir une version qui n'est pas la plus récente affiche
 * un avertissement, sans jamais bloquer — l'apprenant verra exactement ce
 * qui est choisi ici, peu importe ce qui devient officiel plus tard.
 *
 * "Portée" (épopée 5 — assignation par activité) : module entier (comme
 * avant) ou activité précise au sein de ce module — le scénario visé est
 * le rattrapage ciblé (réassigner UNE activité à quelques apprenants
 * précis, sans toucher au reste de leur parcours). Le sélecteur d'activité
 * dépend de la version choisie — son contenu peut varier d'une version à
 * l'autre, voir AssignableModule.versions[].niveaux.
 */
export default function NewAssignationModal({
    isOpen,
    onClose,
    assignableModules,
    groups,
    apprenants,
    userId,
}: NewAssignationModalProps) {
    const router = useRouter()
    const [moduleId, setModuleId] = useState("")
    const [versionId, setVersionId] = useState("")
    const [scopeType, setScopeType] = useState<ScopeType>("module")
    const [niveauId, setNiveauId] = useState("")
    const [targetType, setTargetType] = useState<TargetType>("group")
    const [targetId, setTargetId] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [overriddenGroupName, setOverriddenGroupName] = useState<string | null>(null)

    // Même détection que la liste (voir lib/assignmentOverrides.ts) — averti
    // avant même de confirmer, pas seulement après coup dans la liste.
    // Toujours vérifiée au niveau du MODULE, même quand la portée est une
    // activité précise : le conflit individuel/groupe se joue sur "qui a
    // accès à ce module", pas sur l'activité elle-même.
    useEffect(() => {
        if (targetType !== "apprenant" || !moduleId || !targetId) {
            setOverriddenGroupName(null)
            return
        }
        let cancelled = false
        void getOverriddenGroupAssignment(moduleId, targetId).then((result) => {
            if (!cancelled) setOverriddenGroupName(result?.groupName ?? null)
        })
        return () => {
            cancelled = true
        }
    }, [moduleId, targetType, targetId])

    const selectedModule = assignableModules.find((m) => m.moduleId === moduleId)
    const versions = selectedModule?.versions ?? []
    const mostRecentVersion = versions[versions.length - 1]
    const selectedVersion = versions.find((v) => v.versionId === versionId)
    const showOlderVersionWarning =
        selectedVersion && mostRecentVersion && selectedVersion.versionId !== mostRecentVersion.versionId

    const availableNiveaux = selectedVersion?.niveaux ?? []

    const canSubmit = moduleId && versionId && targetId && (scopeType === "module" || niveauId)

    function handleModuleChange(newModuleId: string) {
        setModuleId(newModuleId)
        setScopeType("module")
        setNiveauId("")
        const module = assignableModules.find((m) => m.moduleId === newModuleId)
        // Présélectionne l'officielle si elle existe, sinon la plus récente.
        const defaultVersion = module?.versions.find((v) => v.isOfficial) ?? module?.versions[module.versions.length - 1]
        setVersionId(defaultVersion?.versionId ?? "")
    }

    function handleVersionChange(newVersionId: string) {
        setVersionId(newVersionId)
        setNiveauId("") // la liste d'activités change avec la version, un id choisi avant peut ne plus exister
    }

    async function handleSubmit() {
        if (!canSubmit) return
        setIsCreating(true)
        await createAssignment({
            targetType: scopeType,
            targetId: scopeType === "niveau" ? niveauId : moduleId,
            versionId,
            assignedTo:
                targetType === "group" ? { type: "group", groupId: targetId } : { type: "apprenant", userId: targetId },
            dueDate: dueDate || undefined,
            assignedByUserId: userId,
        })
        setIsCreating(false)
        resetForm()
        onClose()
        router.refresh()
    }

    function resetForm() {
        setModuleId("")
        setVersionId("")
        setScopeType("module")
        setNiveauId("")
        setTargetType("group")
        setTargetId("")
        setDueDate("")
        setOverriddenGroupName(null)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Nouvelle assignation" maxWidth={480}>
            <h2 className={styles.title}>Nouvelle assignation</h2>

            <label className={styles.field}>
                <span className={styles.label}>Module</span>
                <select value={moduleId} onChange={(e) => handleModuleChange(e.target.value)} className={styles.select}>
                    <option value="" disabled>
                        Choisir un module
                    </option>
                    {assignableModules.map((module) => (
                        <option key={module.moduleId} value={module.moduleId}>
                            {module.title}
                        </option>
                    ))}
                </select>
            </label>

            {moduleId && (
                <label className={styles.field}>
                    <span className={styles.label}>Version</span>
                    <select value={versionId} onChange={(e) => handleVersionChange(e.target.value)} className={styles.select}>
                        {versions.map((version) => (
                            <option key={version.versionId} value={version.versionId}>
                                v{version.versionNumber} — {version.title}
                                {version.isOfficial ? " (officielle)" : ""}
                            </option>
                        ))}
                    </select>
                    {showOlderVersionWarning && mostRecentVersion && (
                        <span className={styles.warning}>
                            Une version plus récente existe (v{mostRecentVersion.versionNumber}).
                        </span>
                    )}
                </label>
            )}

            {moduleId && (
                <div className={styles.field}>
                    <span className={styles.label}>Portée</span>
                    <div className={styles.targetTypeToggle}>
                        <button
                            type="button"
                            className={`${styles.toggleOption} ${scopeType === "module" ? styles.toggleOptionActive : ""}`}
                            onClick={() => {
                                setScopeType("module")
                                setNiveauId("")
                            }}
                        >
                            Module entier
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggleOption} ${scopeType === "niveau" ? styles.toggleOptionActive : ""}`}
                            onClick={() => setScopeType("niveau")}
                            disabled={availableNiveaux.length === 0}
                        >
                            Activité précise
                        </button>
                    </div>
                    {scopeType === "niveau" && availableNiveaux.length === 0 && (
                        <span className={styles.warning}>Cette version n'a aucune activité définie.</span>
                    )}
                </div>
            )}

            {scopeType === "niveau" && availableNiveaux.length > 0 && (
                <label className={styles.field}>
                    <span className={styles.label}>Activité</span>
                    <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} className={styles.select}>
                        <option value="" disabled>
                            Choisir une activité
                        </option>
                        {availableNiveaux.map((niveau) => (
                            <option key={niveau.id} value={niveau.id}>
                                {niveau.title}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className={styles.field}>
                <span className={styles.label}>Assigner à</span>
                <div className={styles.targetTypeToggle}>
                    <button
                        type="button"
                        className={`${styles.toggleOption} ${targetType === "group" ? styles.toggleOptionActive : ""}`}
                        onClick={() => {
                            setTargetType("group")
                            setTargetId("")
                        }}
                    >
                        Un groupe
                    </button>
                    <button
                        type="button"
                        className={`${styles.toggleOption} ${targetType === "apprenant" ? styles.toggleOptionActive : ""}`}
                        onClick={() => {
                            setTargetType("apprenant")
                            setTargetId("")
                        }}
                    >
                        Un apprenant
                    </button>
                </div>
            </div>

            <label className={styles.field}>
                <span className={styles.label}>{targetType === "group" ? "Groupe" : "Apprenant"}</span>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={styles.select}>
                    <option value="" disabled>
                        {targetType === "group" ? "Choisir un groupe" : "Choisir un apprenant"}
                    </option>
                    {targetType === "group"
                        ? groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                  {group.name}
                              </option>
                          ))
                        : apprenants.map((apprenant) => (
                              <option key={apprenant.userId} value={apprenant.userId}>
                                  {apprenant.fullName}
                              </option>
                          ))}
                </select>
                {overriddenGroupName && (
                    <span className={styles.warning}>
                        Remplacera l'assignation de groupe « {overriddenGroupName} » existante pour cette personne.
                    </span>
                )}
            </label>

            <label className={styles.field}>
                <span className={styles.label}>Échéance (facultatif)</span>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={styles.select}
                />
            </label>

            <div className={styles.actions}>
                <Button label="Annuler" variant="outline" onClick={onClose} />
                <Button
                    label={isCreating ? "Assignation..." : "Assigner"}
                    onClick={handleSubmit}
                    disabled={!canSubmit || isCreating}
                />
            </div>
        </Modal>
    )
}