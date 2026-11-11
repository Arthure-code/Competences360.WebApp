"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faFileLines, faPen, faEye, faHistory, faTrashRestore } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { adminCreateNewVersionInModule } from "@/_mocksAdmin/adminContent.actions"
import { routes } from "@/constants/routes"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import styles from "./AdminModuleDetailView.module.css"

interface AdminModuleDetailViewProps {
    module: ContentModule
    versions: ModuleVersion[]
    adminId: string
}

/**
 * "Modifier" un module déjà publié crée un NOUVEAU brouillon (copie de la
 * version officielle) plutôt que de toucher directement à ce que les
 * orgs voient — rien ne change pour elles tant que ce brouillon n'est
 * pas publié (voir AdminEditorView, le nouveau modèle à un seul
 * "Publier"). S'il existe déjà un brouillon non publié, "Modifier" y
 * retourne directement, n'en crée pas un 2e.
 *
 * Historique = lecture seule, jamais une mécanique "choisir laquelle est
 * active" — "Restaurer" copie l'ancien contenu dans un NOUVEAU brouillon,
 * exactement le même principe que "Modifier", pas un retour en arrière
 * silencieux qui réécrirait l'historique.
 */
export default function AdminModuleDetailView({ module, versions, adminId }: AdminModuleDetailViewProps) {
    const router = useRouter()
    const [isWorking, setIsWorking] = useState(false)
    const [restoreTarget, setRestoreTarget] = useState<ModuleVersion | null>(null)

    const officialVersion = versions.find((v) => v.id === module.officialVersionId)
    const existingDraft = versions.find((v) => v.status === "draft")
    // Historique = tout sauf la version officielle actuelle et le brouillon en cours (déjà montrés séparément plus haut).
    const history = versions
        .filter((v) => v.id !== module.officialVersionId && v.id !== existingDraft?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    async function handleModifyClick() {
        if (existingDraft) {
            router.push(routes.admin.contenu.edit(module.id, existingDraft.id))
            return
        }
        if (!officialVersion) return
        setIsWorking(true)
        try {
            const newDraft = await adminCreateNewVersionInModule(module.id, officialVersion.id, "Modification")
            if (newDraft) router.push(routes.admin.contenu.edit(module.id, newDraft.id))
        } finally {
            setIsWorking(false)
        }
    }

    function handleRestoreClick(version: ModuleVersion) {
        // Un brouillon non publié existe déjà → avertir avant de l'écraser, plutôt que de perdre du travail silencieusement.
        if (existingDraft) {
            setRestoreTarget(version)
        } else {
            reallyRestore(version)
        }
    }

    async function reallyRestore(version: ModuleVersion) {
        setIsWorking(true)
        try {
            const newDraft = await adminCreateNewVersionInModule(module.id, version.id, `Restauré depuis la version du ${new Date(version.createdAt).toLocaleDateString("fr-CA")}`)
            if (newDraft) router.push(routes.admin.contenu.edit(module.id, newDraft.id))
        } finally {
            setIsWorking(false)
            setRestoreTarget(null)
        }
    }

    return (
        <div className={styles.page}>
            <Link href={routes.admin.contenu.root} className={styles.backLink}>
                <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" /> Contenu
            </Link>

            <PageHeader title={module.title || "Module sans titre"} />

            {/* Version actuelle — ce que les organisations voient vraiment en ce moment. */}
            <section className={styles.currentSection}>
                <h2 className={styles.sectionTitle}>Version actuelle</h2>
                {officialVersion ? (
                    <div className={styles.currentRow}>
                        <span className={styles.currentDate}>
                            Publiée le {new Date(officialVersion.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                        <div className={styles.currentActions}>
                            <Link href={routes.admin.contenu.preview(module.id, officialVersion.id)} className={styles.secondaryButton}>
                                <FontAwesomeIcon icon={faEye} aria-hidden="true" /> Voir
                            </Link>
                            <Button
                                label={isWorking ? "..." : existingDraft ? "Continuer l'édition" : "Modifier"}
                                onClick={handleModifyClick}
                                disabled={isWorking}
                            />
                        </div>
                    </div>
                ) : (
                    <EmptyState icon={faFileLines} title="Aucune version publiée pour l'instant." bordered />
                )}
            </section>

            {/* Brouillon en cours — un bandeau clair, les orgs ne le voient pas encore. */}
            {existingDraft && (
                <div className={styles.draftBanner}>
                    <FontAwesomeIcon icon={faPen} aria-hidden="true" />
                    <span>
                        Un brouillon est en cours — les organisations voient encore la version ci-dessus tant qu'il
                        n'est pas publié.
                    </span>
                    <Link href={routes.admin.contenu.edit(module.id, existingDraft.id)} className={styles.draftLink}>
                        Continuer l'édition
                    </Link>
                </div>
            )}

            {/* Historique — lecture seule, Restaurer crée un nouveau brouillon, jamais un retour en arrière silencieux. */}
            <section className={styles.historySection}>
                <h2 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faHistory} aria-hidden="true" /> Historique
                </h2>
                {history.length === 0 ? (
                    <p className={styles.noHistory}>Aucune version antérieure.</p>
                ) : (
                    <div className={styles.list}>
                        {history.map((version) => (
                            <div key={version.id} className={styles.row}>
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowDate}>{new Date(version.createdAt).toLocaleDateString("fr-CA")}</span>
                                    {version.changeNote && <span className={styles.rowNote}>{version.changeNote}</span>}
                                </div>
                                <div className={styles.rowActions}>
                                    <Link href={routes.admin.contenu.preview(module.id, version.id)} className={styles.secondaryButton}>
                                        <FontAwesomeIcon icon={faEye} aria-hidden="true" /> Voir
                                    </Link>
                                    <button type="button" className={styles.restoreButton} onClick={() => handleRestoreClick(version)} disabled={isWorking}>
                                        <FontAwesomeIcon icon={faTrashRestore} aria-hidden="true" /> Restaurer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <Modal isOpen={restoreTarget !== null} onClose={() => setRestoreTarget(null)} ariaLabel="Remplacer le brouillon en cours ?" maxWidth={440}>
                <h2 className={styles.modalTitle}>Remplacer le brouillon en cours ?</h2>
                <p className={styles.modalText}>
                    Vous avez déjà des changements non publiés. Restaurer cette ancienne version les remplacera —
                    rien n'est perdu pour de bon (cette ancienne version reste dans l'historique), mais vos
                    changements actuels le seraient.
                </p>
                <div className={styles.modalActions}>
                    <Button label="Annuler" variant="outline" onClick={() => setRestoreTarget(null)} />
                    <Button
                        label={isWorking ? "..." : "Oui, remplacer"}
                        variant="danger"
                        onClick={() => restoreTarget && reallyRestore(restoreTarget)}
                        disabled={isWorking}
                    />
                </div>
            </Modal>
        </div>
    )
}