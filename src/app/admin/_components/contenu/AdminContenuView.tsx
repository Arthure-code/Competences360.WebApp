"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { faFileLines, faTrashRestore, faTrash, faClock } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import EmptyState from "@/components/ui/EmptyState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { createAdminModuleFromScratch } from "@/_mocksAdmin/adminContent.actions"
import { restoreModuleFromTrash, moveModuleToTrash } from "@/_mocks/contentModules.actions"
import { getDaysRemainingInTrash } from "@/lib/contentTrash"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import { getAdminFullName } from "@/lib/adminUser"
import { routes } from "@/constants/routes"
import type { ModuleVersionContent } from "@/types/moduleVersion"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { AdminUser } from "@/types/adminUser"
import styles from "./AdminContenuView.module.css"

export interface ModuleCardData {
    module: ContentModule
    displayVersion: ModuleVersion
}

interface AdminContenuViewProps {
    baseModules: ContentModule[]
    draftCards: ModuleCardData[]
    trashedModules: ContentModule[]
    admin: AdminUser
}

type TabId = "base" | "draft" | "trash"

const EMPTY_CONTENT: ModuleVersionContent = { title: "Nouveau module", description: "", categoryId: "", niveaux: [], externalLinks: [] }

/**
 * "Contenu de base" — maintenant CLIQUABLE, confirmé par le backend
 * (GET /api/contentmodules/base retourne de vrais ContentModule, plus
 * des PlatformTemplate/gabarits sans id utilisable).
 */
export default function AdminContenuView({ baseModules, draftCards, trashedModules, admin }: AdminContenuViewProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabId>("base")
    const [isCreating, setIsCreating] = useState(false)
    const configuration = usePlatformConfiguration()

    const tabs = [
        { id: "base", label: `Contenu de base (${baseModules.length})` },
        { id: "draft", label: `Privé (${draftCards.length})` },
        { id: "trash", label: `Corbeille (${trashedModules.length})` },
    ] as const

    async function handleCreate() {
        setIsCreating(true)
        try {
            const { module, version } = await createAdminModuleFromScratch({
                adminId: admin.id,
                adminName: getAdminFullName(admin),
                changeNote: "Création initiale",
                content: EMPTY_CONTENT,
            })
            router.push(routes.admin.contenu.edit(module.id, version.id))
        } finally {
            setIsCreating(false)
        }
    }

    async function handleRestore(e: React.MouseEvent, moduleId: string) {
        e.preventDefault()
        e.stopPropagation()
        await restoreModuleFromTrash(moduleId)
        router.refresh()
    }

    /** Propriétaire met son propre brouillon à la corbeille — isAdminAction PAS envoyé ici, contrairement à la supervision (organisationContent.actions.ts) : c'est son propre contenu, pas une intervention sur celui d'une org. */
    async function handleTrashDraft(e: React.MouseEvent, moduleId: string) {
        e.preventDefault()
        e.stopPropagation()
        await moveModuleToTrash(moduleId, admin.id, false)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Contenu"
                subtitle="Le contenu de base de la plateforme, forkable par toutes les organisations."
                actions={<Button label={isCreating ? "Création..." : "+ Créer un module"} onClick={handleCreate} disabled={isCreating} />}
            />

            <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

            {activeTab === "base" &&
                (baseModules.length === 0 ? (
                    <EmptyState icon={faFileLines} title="Aucun contenu de base pour l'instant." bordered />
                ) : (
                    <div className={styles.grid}>
                        {baseModules.map((module) => (
                            <Link key={module.id} href={routes.admin.contenu.module(module.id)} className={styles.cardLink}>
                                <Card padding="md" className={styles.simpleCard}>
                                    <h3 className={styles.simpleCardTitle}>{module.title || "Module sans titre"}</h3>
                                    <span className={module.officialVersionId ? styles.badgeOfficial : styles.badgeDraft}>
                                        {module.officialVersionId ? "Officiel" : "Aucune version appliquée"}
                                    </span>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ))}

            {activeTab === "draft" &&
                (draftCards.length === 0 ? (
                    <EmptyState
                        icon={faFileLines}
                        title="Aucun brouillon pour l'instant."
                        description="Cliquez « Créer un module » pour commencer."
                        bordered
                    />
                ) : (
                    <div className={styles.grid}>
                        {draftCards.map(({ module, displayVersion }) => (
                            <Link key={module.id} href={routes.admin.contenu.edit(module.id, displayVersion.id)} className={styles.cardLink}>
                                <Card padding="md" className={styles.simpleCard}>
                                    <h3 className={styles.simpleCardTitle}>{displayVersion.content.title || "Module sans titre"}</h3>
                                    <p className={styles.simpleCardDescription}>{displayVersion.content.description}</p>
                                    <button
                                        type="button"
                                        className={styles.trashButton}
                                        onClick={(e) => handleTrashDraft(e, module.id)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} aria-hidden="true" /> Mettre à la corbeille
                                    </button>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ))}

            {activeTab === "trash" &&
                (trashedModules.length === 0 ? (
                    <EmptyState icon={faFileLines} title="La corbeille est vide." bordered />
                ) : (
                    <div className={styles.grid}>
                        {trashedModules.map((module) => {
                            const daysRemaining = module.trashedAt
                                ? getDaysRemainingInTrash(module.trashedAt, configuration.joursCorbeilleContenu)
                                : 0
                            return (
                                <Card key={module.id} padding="md" className={styles.simpleCard}>
                                    <h3 className={styles.simpleCardTitle}>{module.title || "Module sans titre"}</h3>
                                    <span className={styles.countdown}>
                                        <FontAwesomeIcon icon={faClock} aria-hidden="true" />
                                        {daysRemaining > 0
                                            ? `Supprimé définitivement dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
                                            : "Sera bientôt supprimé définitivement"}
                                    </span>
                                    <button type="button" className={styles.restoreButton} onClick={(e) => handleRestore(e, module.id)}>
                                        <FontAwesomeIcon icon={faTrashRestore} aria-hidden="true" /> Restaurer
                                    </button>
                                </Card>
                            )
                        })}
                    </div>
                ))}
        </div>
    )
}