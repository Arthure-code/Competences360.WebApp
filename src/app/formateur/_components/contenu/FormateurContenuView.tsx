"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { faFileLines, faTags } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import ContentModuleCard from "@/app/formateur/_components/contenu/ContentModuleCard"
import SharedModuleCard from "@/components/shared/SharedModuleCard"
import GlobalCatalogCard from "@/components/shared/GlobalCatalogCard"
import TrashedModuleCard from "@/components/shared/TrashedModuleCard"
import NewContentActions from "@/components/shared/NewContentActions"
import CategoriesManager from "@/components/shared/CategoriesManager"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { Category } from "@/types/category"
import type { SharedModuleGroup } from "@/lib/contentSharing"
import styles from "./FormateurContenuView.module.css"

export interface ModuleCardData {
    module: ContentModule
    displayVersion: ModuleVersion
    attributionLabel: string
    /** Sert au badge "En révision" dans l'onglet Privé, absent/ignoré ailleurs */
    unresolvedCommentCount?: number
    /** Épopée 4 — corbeille, calculé côté serveur (voir canTrashModule, lib/contentTrash.ts) */
    canTrash?: boolean
}

export interface TrashedModuleData {
    module: ContentModule
    trashedByName: string
}

interface ContenuViewProps {
    draftCards: ModuleCardData[]
    officialCards: ModuleCardData[]
    sharedGroups: SharedModuleGroup[]
    /** Contenu de base de la plateforme, forkable — voir platformTemplates.mock.ts, remplace l'ancien Module[] (modules.mock.ts, retiré) */
    templateModules: PlatformTemplate[]
    /** Épopée 4 — corbeille, voir TrashedModuleCard */
    trashedModules: TrashedModuleData[]
    categories: Category[]
    /** Épopée 8 — calculé côté SERVEUR (voir page.tsx, getModuleCountForCategory) — jamais chargé côté client ici, voir le commentaire sur CategoriesManager plus bas pour pourquoi c'était le vrai bug */
    categoryModuleCounts: Record<string, number>
    organizationId: string
    organizationName: string
    userId: string
    /** Un compte cumulant formateur ET gestionnaire (voir usersMock.formateurGestionnaire) garde ses vrais droits élargis sur les catégories, même sur cette page scopée formateur */
    isGestionnaireOfThisOrg?: boolean
}

type TabId = "shared" | "official" | "draft" | "templates" | "trash"

const TAB_DESCRIPTIONS: Record<TabId, string> = {
    shared: "Contenu publié par vous ou vos collègues, pas encore officiel.",
    official: "La version officielle actuelle de chaque module.",
    draft: "Vos brouillons, visibles uniquement par vous.",
    templates: "Contenu fourni par la plateforme, pas encore présent dans votre organisation — cliquez pour le personnaliser.",
    trash: "Modules mis de côté — récupérables pendant 21 jours, puis supprimés définitivement.",
}

/**
 * "Partagé" en 1er, pas "Privé" — un formateur veut d'abord voir ce qui
 * existe déjà (le sien et celui des collègues) avant de recréer quelque
 * chose depuis zéro. "Mes publications" n'existe plus séparément :
 * absorbé dans "Partagé", qui montre déjà tout le publié non-officiel,
 * la mienne comprise (voir lib/contentSharing.ts, isMine).
 *
 * "Corbeille" (épopée 4) volontairement en dernier — pas ce qu'on vient
 * chercher en premier, mais toujours accessible d'un clic si besoin de
 * récupérer quelque chose. Le geste "mettre à la corbeille" lui-même vit
 * sur ContentModuleCard (Privé/Contenu de l'org), pas ici — cet onglet ne
 * fait que consulter/restaurer.
 *
 * Catégories (modal) : categories/categoryModuleCounts viennent
 * maintenant TOUS DEUX de page.tsx (Server Component), plus d'un fetch
 * client à l'ouverture du modal comme avant. Vrai bug trouvé : appeler
 * getCategoriesForOrganization depuis CE composant "use client" lisait la
 * copie du tableau CATEGORIES isolée dans le NAVIGATEUR (Next.js bundle
 * séparément client et serveur), jamais celle vraiment mutée par
 * createCategory (une vraie Server Action, "use server", qui mute la
 * copie serveur) — router.refresh() rafraîchissait bien le serveur, mais
 * un fetch client déclenché depuis ce composant ne repassait jamais par
 * ce serveur rafraîchi. Exactement le même piège déjà documenté pour
 * apprenantModuleProgress.mock.ts.
 */
export default function FormateurContenuView({
    draftCards,
    officialCards,
    sharedGroups,
    templateModules,
    trashedModules,
    categories,
    categoryModuleCounts,
    organizationId,
    organizationName,
    userId,
    isGestionnaireOfThisOrg = false,
}: ContenuViewProps) {
    const searchParams = useSearchParams()

    const tabs = [
        { id: "draft", label: `Privé (${draftCards.length})` },
        { id: "shared", label: `Partagé (${sharedGroups.length})` },
        { id: "official", label: `Contenu de ${organizationName} (${officialCards.length})` },
        { id: "templates", label: `Modèles (${templateModules.length})` },
        { id: "trash", label: `Corbeille (${trashedModules.length})` },
    ] as const
    const TAB_IDS = tabs.map((t) => t.id) as readonly string[]

    // Utile pour "Retour au contenu" depuis l'éditeur (voir
    // EditorView.tsx, backHref) — atterrit directement sur Privé plutôt
    // que sur l'onglet par défaut, puisque c'est là qu'on retrouve ce
    // qu'on venait de créer/modifier.
    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const param = searchParams.get("onglet")
        return param && TAB_IDS.includes(param) ? (param as TabId) : "draft"
    })

    const [isCategoriesModalOpen, setCategoriesModalOpen] = useState(false)

    const standardCardsByTab: Record<Extract<TabId, "draft" | "official">, ModuleCardData[]> = {
        draft: draftCards,
        official: officialCards,
    }

    const categoryById = new Map(categories.map((c) => [c.id, c]))

    const isEmpty =
        activeTab === "shared"
            ? sharedGroups.length === 0
            : activeTab === "templates"
              ? templateModules.length === 0
              : activeTab === "trash"
                ? trashedModules.length === 0
                : standardCardsByTab[activeTab].length === 0

    return (
        <div className={styles.page}>
            <PageHeader
                title="Contenu"
                subtitle="Vos brouillons, vos publications, et le contenu officiel de l'organisation."
                actions={
                    <>
                        <button type="button" className={styles.categoriesLink} onClick={() => setCategoriesModalOpen(true)}>
                            <FontAwesomeIcon icon={faTags} aria-hidden="true" /> Gérer les catégories
                        </button>
                        <NewContentActions organizationId={organizationId} userId={userId} role="formateur" />
                    </>
                }
            />

            <Modal
                isOpen={isCategoriesModalOpen}
                onClose={() => setCategoriesModalOpen(false)}
                ariaLabel="Gérer les catégories"
                maxWidth={560}
            >
                <CategoriesManager
                    categories={categories}
                    moduleCounts={categoryModuleCounts}
                    organizationId={organizationId}
                    userId={userId}
                    isGestionnaireOfThisOrg={isGestionnaireOfThisOrg}
                />
            </Modal>

            <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
            <p className={styles.tabDescription}>{TAB_DESCRIPTIONS[activeTab]}</p>

            {isEmpty ? (
                <EmptyState
                    icon={faFileLines}
                    title={activeTab === "trash" ? "La corbeille est vide." : "Rien à afficher ici pour l'instant."}
                    bordered
                />
            ) : activeTab === "shared" ? (
                <div className={styles.sharedList}>
                    {sharedGroups.map((group) => (
                        <SharedModuleCard key={group.module.id} group={group} role="formateur" />
                    ))}
                </div>
            ) : activeTab === "templates" ? (
                <div className={styles.grid}>
                    {templateModules.map((template) => (
                        <GlobalCatalogCard
                            key={template.id}
                            template={template}
                            category={categoryById.get(template.content.categoryId)}
                            organizationId={organizationId}
                            userId={userId}
                            role="formateur"
                        />
                    ))}
                </div>
            ) : activeTab === "trash" ? (
                <div className={styles.grid}>
                    {trashedModules.map(({ module, trashedByName }) => (
                        <TrashedModuleCard key={module.id} module={module} trashedByName={trashedByName} />
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {standardCardsByTab[activeTab].map(({ module, displayVersion, attributionLabel, unresolvedCommentCount, canTrash }) => (
                        <ContentModuleCard
                            key={module.id}
                            module={module}
                            displayVersion={displayVersion}
                            attributionLabel={attributionLabel}
                            role="formateur"
                            unresolvedCommentCount={unresolvedCommentCount}
                            canTrash={canTrash}
                            userId={userId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}