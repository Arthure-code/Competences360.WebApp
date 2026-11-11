"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faFileLines, faEye } from "@fortawesome/free-solid-svg-icons"
import PageSubheader from "@/components/ui/PageSubheader"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { superviseTrashModule } from "@/_mocksToMigrate/organisationContent.actions"
import { routes } from "@/constants/routes"
import type { ContentModule } from "@/types/contentModule"
import styles from "./OrganisationContentSection.module.css"

interface OrganisationContentSectionProps {
    modules: ContentModule[]
    organizationId: string
    organizationName: string
    adminId: string
}

/**
 * Supervision, pas édition — JAMAIS de lien vers un éditeur ici (voir la
 * discussion : aucune plateforme sérieuse ne laisse un modérateur
 * réécrire silencieusement le travail de quelqu'un). Seule action
 * possible : retirer, avec une raison obligatoire, consignée dans le
 * journal d'audit (voir organisationContent.actions.ts pour les
 * vraies limites actuelles de moveModuleToTrash).
 */
export default function OrganisationContentSection({ modules, organizationId, organizationName, adminId }: OrganisationContentSectionProps) {
    const router = useRouter()
    const [targetModule, setTargetModule] = useState<ContentModule | null>(null)
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const activeModules = modules.filter((m) => !m.trashedAt)

    function openTrashDialog(module: ContentModule) {
        setTargetModule(module)
        setReason("")
        setError(null)
    }

    async function handleConfirm() {
        if (!targetModule) return
        setIsSubmitting(true)
        setError(null)
        const result = await superviseTrashModule({
            moduleId: targetModule.id,
            adminId,
            reason,
        })
        setIsSubmitting(false)
        if (!result.success) {
            setError(result.error ?? "Une erreur est survenue.")
            return
        }
        setTargetModule(null)
        router.refresh()
    }

    return (
        <section className={styles.section}>
            <PageSubheader title="Contenu" subtitle="Supervision seule — consultez, retirez si inapproprié. Jamais d'édition depuis ici." />

            {activeModules.length === 0 ? (
                <EmptyState icon={faFileLines} title="Aucun contenu actif pour cette organisation." bordered />
            ) : (
                <div className={styles.list}>
                    {activeModules.map((module) => (
                        <div key={module.id} className={styles.row}>
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>{module.title}</span>
                                <span className={module.officialVersionId ? styles.badgeOfficial : styles.badgeDraft}>
                                    {module.officialVersionId ? "Officiel" : "Aucune version appliquée"}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                {module.officialVersionId ? (
                                    <Link
                                        href={routes.admin.contenu.preview(module.id, module.officialVersionId)}
                                        className={styles.viewButton}
                                    >
                                        <FontAwesomeIcon icon={faEye} aria-hidden="true" /> Voir
                                    </Link>
                                ) : (
                                    <span className={styles.viewUnavailable} title="Aucune version officielle à prévisualiser">
                                        <FontAwesomeIcon icon={faEye} aria-hidden="true" /> Voir
                                    </span>
                                )}
                                <button type="button" className={styles.trashButton} onClick={() => openTrashDialog(module)}>
                                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" /> Retirer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={targetModule !== null} onClose={() => setTargetModule(null)} ariaLabel="Retirer ce contenu" maxWidth={480}>
                <h2 className={styles.modalTitle}>Retirer « {targetModule?.title} » ?</h2>
                <p className={styles.modalText}>
                    Ce module sera mis à la corbeille pour {organizationName}. Une raison est obligatoire — elle sera
                    consignée dans le journal d'audit.
                </p>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Raison</span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Ex. Contenu signalé pour propos inappropriés — voir signalement #3"
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button label="Annuler" variant="outline" onClick={() => setTargetModule(null)} />
                    <Button
                        label={isSubmitting ? "Retrait..." : "Retirer définitivement"}
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                    />
                </div>
            </Modal>
        </section>
    )
}