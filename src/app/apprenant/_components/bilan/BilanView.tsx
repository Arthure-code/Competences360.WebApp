"use client"

import { useEffect, useState } from "react"
import { getCategoryById } from "@/_mocks/categories.mock"
import { getBadgeUnlockedNotice } from "@/lib/notices"
import { useHydratedModule } from "@/hooks/useHydratedModule"
import { routes } from "@/constants/routes"
import BilanNiveau from "@/app/apprenant/_components/bilan/BilanNiveau"
import ProgressionMessage from "@/app/apprenant/_components/bilan/ProgressionMessage"
import Breadcrumb from "@/components/ui/Breadcrumb"
import type { BadgeReward } from "@/types/reward"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./BilanView.module.css"

interface BilanViewProps {
    module: Module
    niveauId: string
    dueDate?: string
}

/**
 * useHydratedModule (hooks/useHydratedModule.ts) recalcule la progression
 * au montage ET à chaque reprise de focus — le score réel
 * (niveau.intro.currentScore) n'existe qu'après cette hydratation, donc
 * badgeReward ne peut être construit qu'ici, jamais côté serveur.
 */
export default function BilanView({ module: initialModule, niveauId, dueDate }: BilanViewProps) {
    const learningModule = useHydratedModule(initialModule, dueDate)
    const [category, setCategory] = useState<Category | undefined>(undefined)

    useEffect(() => {
        getCategoryById(initialModule.categoryId).then(setCategory)
    }, [initialModule.categoryId])

    const niveau = learningModule.niveaux.find((n) => n.id === niveauId)
    if (!niveau) return null

    const nextNiveau = learningModule.niveaux.find((n) => n.index === niveau.index + 1) ?? null

    // Reward synthétique représentant cette activité tout juste complétée —
    // pas encore de vraie persistance de récompense (voir
    // _mocks/rewards.mock.ts), donc reconstruite ici à la volée avec la
    // même logique de score que ce mock, pour rester cohérent entre les
    // deux.
    const badgeReward: BadgeReward = {
        id: `badge-${niveau.id}`,
        type: "badge",
        niveauId: niveau.id,
        moduleId: learningModule.id,
        categoryId: learningModule.categoryId,
        difficulty: niveau.difficulty,
        score: niveau.intro.currentScore ?? niveau.intro.maxScore,
        maxScore: niveau.intro.maxScore,
        earnedAt: new Date().toISOString(),
    }

    return (
        <div className={styles.wrapper}>
            <Breadcrumb
                items={[
                    { label: "Modules", href: routes.apprenant.modules.root },
                    ...(category
                        ? [{ label: category.label, href: routes.apprenant.modules.filterByCategory(category.id) }]
                        : []),
                    { label: learningModule.title, href: routes.apprenant.modules.bySlug(learningModule.slug) },
                    { label: niveau.title },
                ]}
            />

            <ProgressionMessage
                niveauId={niveau.exercises[0]?.niveauId ?? niveau.id}
                maxScore={niveau.intro.maxScore}
            />

            <BilanNiveau
                moduleSlug={learningModule.slug}
                niveau={niveau}
                notice={getBadgeUnlockedNotice(badgeReward, [learningModule])}
                nextNiveauHref={
                    nextNiveau ? routes.apprenant.modules.niveau(learningModule.slug, nextNiveau.slug) : null
                }
                backToModuleHref={routes.apprenant.modules.bySlug(learningModule.slug)}
            />
        </div>
    )
}