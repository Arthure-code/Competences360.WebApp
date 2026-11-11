"use client"

import { useEffect, useState } from "react"
import { faLayerGroup, faLink, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Breadcrumb from "@/components/ui/Breadcrumb"
import PageHeader from "@/components/ui/PageHeader"
import PageSubheader from "@/components/ui/PageSubheader"
import AudioButton from "@/components/ui/AudioButton"
import ProgressBar from "@/components/ui/ProgressBar"
import EmptyState from "@/components/ui/EmptyState"
import CategoryTag from "@/components/shared/CategoryTag"
import NiveauRow from "@/app/apprenant/_components/modules/NiveauRow"
import { routes } from "@/constants/routes"
import { useHydratedModule } from "@/hooks/useHydratedModule"
import { getCategoryById } from "@/_mocks/categories.mock"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./ModuleDetailView.module.css"

interface ModuleDetailViewProps {
    module: Module
    dueDate?: string
}

const FALLBACK_COLOR = "#6E6E73"

/**
 * useHydratedModule (hooks/useHydratedModule.ts) recalcule la progression
 * au montage ET à chaque reprise de focus — pas juste au montage, pour
 * rester correct même quand le cache de navigation de Next.js réutilise
 * ce composant sans le remonter en revenant sur cette page.
 *
 * Section "Liens externes" ajoutée, après "Activités" — simple liste de
 * ressources, chaque lien ouvre dans un nouvel onglet (target="_blank",
 * rel="noopener noreferrer" contre le tabnabbing). Aucune mécanique de
 * progression/correction, contrairement aux activités juste au-dessus.
 * Absente entièrement si le module n'a aucun lien externe — pas de
 * section vide à afficher pour rien.
 */
export default function ModuleDetailView({ module: initialModule, dueDate }: Readonly<ModuleDetailViewProps>) {
    const learningModule = useHydratedModule(initialModule, dueDate)
    const [category, setCategory] = useState<Category | undefined>(undefined)

    useEffect(() => {
        getCategoryById(initialModule.categoryId).then(setCategory)
    }, [initialModule.categoryId])

    const color = category?.color ?? FALLBACK_COLOR

    return (
        <div className={styles.page}>
            <Breadcrumb
                items={[
                    { label: "Modules", href: routes.apprenant.modules.root },
                    ...(category
                        ? [{ label: category.label, href: routes.apprenant.modules.filterByCategory(category.id) }]
                        : []),
                    { label: learningModule.title },
                ]}
            />

            <PageHeader
                eyebrow={
                    <>
                        <div className={styles.eyebrowLeftContent}>
                            <CategoryTag
                                label={category?.label ?? "Catégorie"}
                                color={color}
                                iconName={category?.iconName ?? "faTag"}
                            />
                            <AudioButton text={[learningModule.title, learningModule.description].filter(Boolean).join(". ")} />
                        </div>
                        <div className={styles.progressInline}>
                            <ProgressBar value={learningModule.progressPercent} className={styles.progressBar} />
                            <span className={styles.progressLabel}>
                                {learningModule.progressLabelOverride ?? `${learningModule.progressPercent}%`}
                            </span>
                        </div>
                    </>
                }
                title={learningModule.title}
                subtitle={learningModule.description}
            />

            <section className={styles.niveauxSection}>
                <PageSubheader title="Activités" subtitle="Progressez à votre rythme, de novice à expert." />

                {learningModule.niveaux.length === 0 ? (
                    <EmptyState
                        icon={faLayerGroup}
                        title="Contenu à venir"
                        description="Les activités de ce module n'ont pas encore été publiées."
                    />
                ) : (
                    <div className={styles.niveauxList}>
                        {learningModule.niveaux.map((niveau) => (
                            <NiveauRow key={niveau.id} moduleSlug={learningModule.slug} niveau={niveau} />
                        ))}
                    </div>
                )}
            </section>

            {learningModule.externalLinks.length > 0 && (
                <section className={styles.externalLinksSection}>
                    <PageSubheader title="Liens externes" subtitle="Ressources complémentaires à consulter." />

                    <div className={styles.externalLinksList}>
                        {learningModule.externalLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.externalLinkRow}
                            >
                                <FontAwesomeIcon icon={faLink} className={styles.externalLinkIcon} aria-hidden="true" />
                                <span className={styles.externalLinkTitle}>{link.title || link.url}</span>
                                <FontAwesomeIcon
                                    icon={faArrowUpRightFromSquare}
                                    className={styles.externalLinkOpenIcon}
                                    aria-hidden="true"
                                />
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}