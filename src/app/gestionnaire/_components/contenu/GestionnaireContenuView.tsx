"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { faFileLines } from "@fortawesome/free-solid-svg-icons"
import PageHeader from "@/components/ui/PageHeader"
import Tabs from "@/components/ui/Tabs"
import EmptyState from "@/components/ui/EmptyState"
import ContentModuleCard from "@/app/formateur/_components/contenu/ContentModuleCard"
import PendingReviewCard from "@/app/gestionnaire/_components/contenu/PendingReviewCard"
import SharedModuleCard from "@/components/shared/SharedModuleCard"
import GlobalCatalogCard from "@/components/shared/GlobalCatalogCard"
import TrashedModuleCard from "@/components/shared/TrashedModuleCard"
import NewContentActions from "@/components/shared/NewContentActions"
import type { ContentModule } from "@/types/contentModule"
import type { ModuleVersion } from "@/types/moduleVersion"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { Category } from "@/types/category"
import type { SharedModuleGroup } from "@/lib/contentSharing"
import styles from "./GestionnaireContenuView.module.css"

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
    pendingReviewCards: ModuleCardData[]
    sharedGroups: SharedModuleGroup[]
    /** Contenu de base de la plateforme, forkable — voir platformTemplates.mock.ts, remplace l'ancien Module[] (modules.mock.ts, retiré) */
    templateModules: PlatformTemplate[]
    /** Épopée 4 — corbeille, voir TrashedModuleCard */
    trashedModules: TrashedModuleData[]
    categories: Category[]
    organizationId: string
    organizationName: string
    userId: string
}

type TabId = "pending" | "official" | "shared" | "templates" | "draft" | "trash"

const TAB_DESCRIPTIONS: Record<TabId, string> = {
    pending: "Modules automatiquement appliqués en attendant votre confirmation.",
    official: "La version officielle actuelle de chaque module.",
    shared: "Tout le contenu publié de l'organisation qui n'est pas encore officiel.",
    templates: "Contenu fourni par la plateforme, pas encore présent dans votre organisation — cliquez pour le personnaliser.",
    draft: "Vos brouillons, visibles uniquement par vous.",
    trash: "Modules mis de côté — récupérables pendant 21 jours, puis supprimés définitivement.",
}

/**
 * "À réviser" reste distincte de "Partagé" — la 1ère est une file
 * d'action (une décision à prendre), la 2e une vue d'ensemble (regarder
 * ce qui existe). "Partagé" exclut la version déjà dans "À réviser"
 * (filtré en amont, voir page.tsx + lib/contentSharing.ts) pour ne pas
 * l'afficher deux fois. Pas de "Mes publications" : publier soi-même
 * s'applique ET se marque révisé du même geste (voir publishVersion) —
 * cet onglet ne peut structurellement plus jamais rien contenir ici.
 *
 * "Modèles" (templateModules) réutilise la même donnée que l'onglet
 * "Catalogue global" de ForkModulePicker (getForkableModules) — désormais
 * PlatformTemplate[] (platformTemplates.mock.ts), plus l'ancien Module[]
 * (modules.mock.ts, retiré).
 *
 * "Corbeille" (épopée 4) volontairement en dernier — comme côté
 * formateur, mais visible ici sur TOUT le contenu de l'org (le
 * gestionnaire peut mettre à la corbeille le contenu de n'importe qui,
 * pas juste le sien).
 */
export default function GestionnaireContenuView({
    draftCards,
    officialCards,
    pendingReviewCards,
    sharedGroups,
    templateModules,
    trashedModules,
    categories,
    organizationId,
    organizationName,
    userId,
}: ContenuViewProps) {
    const searchParams = useSearchParams()

    const tabs = [
        { id: "pending", label: `À réviser (${pendingReviewCards.length})` },
        { id: "official", label: `Contenu de ${organizationName} (${officialCards.length})` },
        { id: "shared", label: `Partagé (${sharedGroups.length})` },
        { id: "templates", label: `Modèles (${templateModules.length})` },
        { id: "draft", label: `Privé (${draftCards.length})` },
        { id: "trash", label: `Corbeille (${trashedModules.length})` },
    ] as const
    const TAB_IDS = tabs.map((t) => t.id) as readonly string[]

    // Utile pour "Retour au contenu" depuis l'éditeur (voir
    // EditorView.tsx, backHref) — atterrit directement sur Privé plutôt
    // que sur l'onglet par défaut.
    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const param = searchParams.get("onglet")
        return param && TAB_IDS.includes(param) ? (param as TabId) : "pending"
    })

    const standardCardsByTab: Record<Extract<TabId, "draft" | "official">, ModuleCardData[]> = {
        draft: draftCards,
        official: officialCards,
    }

    const categoryById = new Map(categories.map((c) => [c.id, c]))

    const isEmpty =
        activeTab === "pending"
            ? pendingReviewCards.length === 0
            : activeTab === "shared"
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
                subtitle="Le contenu officiel de l'organisation, ce qui attend votre révision, et ce qui est partagé mais pas encore officiel."
                actions={<NewContentActions organizationId={organizationId} userId={userId} role="gestionnaire" />}
            />

            <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
            <p className={styles.tabDescription}>{TAB_DESCRIPTIONS[activeTab]}</p>

            {isEmpty ? (
                <EmptyState
                    icon={faFileLines}
                    title={
                        activeTab === "pending"
                            ? "Rien à réviser pour l'instant."
                            : activeTab === "trash"
                              ? "La corbeille est vide."
                              : "Rien à afficher ici pour l'instant."
                    }
                    bordered
                />
            ) : activeTab === "pending" ? (
                <div className={styles.grid}>
                    {pendingReviewCards.map(({ module, displayVersion, attributionLabel }) => (
                        <PendingReviewCard
                            key={module.id}
                            module={module}
                            displayVersion={displayVersion}
                            attributionLabel={attributionLabel}
                            gestionnaireUserId={userId}
                        />
                    ))}
                </div>
            ) : activeTab === "shared" ? (
                <div className={styles.sharedList}>
                    {sharedGroups.map((group) => (
                        <SharedModuleCard key={group.module.id} group={group} role="gestionnaire" />
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
                            role="gestionnaire"
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
                            role="gestionnaire"
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