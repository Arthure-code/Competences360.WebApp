"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./CreateVersionModal.module.css"

interface CreateVersionModalProps {
    isOpen: boolean
    onClose: () => void
    versions: ModuleVersion[]
    versionNumbers: Map<string, number>
    currentVersionCount: number
    onCreate: (sourceVersionId: string, note: string) => Promise<void>
}

export default function CreateVersionModal({
    isOpen,
    onClose,
    versions,
    versionNumbers,
    currentVersionCount,
    onCreate,
}: CreateVersionModalProps) {
    const { maxVersionsParModule } = usePlatformConfiguration()
    const [sourceVersionId, setSourceVersionId] = useState(versions[0]?.id ?? "")
    const [note, setNote] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    const isAtLimit = currentVersionCount >= maxVersionsParModule

    async function handleCreate() {
        if (!sourceVersionId || isAtLimit) return
        setIsCreating(true)
        await onCreate(sourceVersionId, note)
        setIsCreating(false)
        setNote("")
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Créer une nouvelle version" maxWidth={480}>
            <h2 className={styles.title}>Créer une nouvelle version</h2>

            {isAtLimit ? (
                <p className={styles.limitWarning}>
                    Ce module a atteint la limite de {maxVersionsParModule} versions. Supprimez une version
                    existante pour en créer une nouvelle.
                </p>
            ) : (
                <>
                    <label className={styles.field}>
                        <span className={styles.label}>Partir de la version</span>
                        <select
                            value={sourceVersionId}
                            onChange={(e) => setSourceVersionId(e.target.value)}
                            className={styles.select}
                        >
                            {versions.map((version) => (
                                <option key={version.id} value={version.id}>
                                    v{versionNumbers.get(version.id)} — {version.content.title || "Sans titre"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Note (facultatif)</span>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={styles.textarea}
                            rows={2}
                            placeholder="Un résumé automatique du contenu sera généré — cette note est un ajout, pas obligatoire."
                        />
                    </label>

                    <div className={styles.actions}>
                        <Button label="Annuler" variant="outline" onClick={onClose} />
                        <Button
                            label={isCreating ? "Création..." : "Créer"}
                            onClick={handleCreate}
                            disabled={isCreating || !sourceVersionId}
                        />
                    </div>
                </>
            )}
        </Modal>
    )
}
