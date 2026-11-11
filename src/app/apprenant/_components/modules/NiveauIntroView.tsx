"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { faLayerGroup, faClock, faStar } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Breadcrumb from "@/components/ui/Breadcrumb"
import AudioButton from "@/components/ui/AudioButton"
import ChecklistItem from "@/components/ui/ChecklistItem"
import Button from "@/components/ui/Button"
import { routes } from "@/constants/routes"
import { useHydratedModule } from "@/hooks/useHydratedModule"
import ScoringLegend from "@/components/shared/ScoringLegend"
import { getCategoryById } from "@/_mocks/categories.mock"
import type { Module } from "@/types/module"
import type { Category } from "@/types/category"
import styles from "./NiveauIntroView.module.css"

interface NiveauIntroViewProps {
    module: Module
    niveauId: string
    dueDate?: string
}

const DIFFICULTY_LABELS: Record<string, string> = {
    novice: "Novice",
    intermediaire: "Intermédiaire",
    expert: "Expert",
}

/**
 * useHydratedModule (hooks/useHydratedModule.ts) recalcule la progression
 * au montage ET à chaque reprise de focus — nécessaire pour rester à jour
 * quand on revient d'avoir répondu à un exercice, même si le cache de
 * navigation de Next.js réutilise cette page sans la remonter. Progression
 * toujours libre : aucun état "verrouillé" à gérer ici.
 */
export default function NiveauIntroView({ module: initialModule, niveauId, dueDate }: NiveauIntroViewProps) {
    const learningModule = useHydratedModule(initialModule, dueDate)
    const [category, setCategory] = useState<Category | undefined>(undefined)

    useEffect(() => {
        void getCategoryById(initialModule.categoryId).then(setCategory)
    }, [initialModule.categoryId])

    const niveau = learningModule.niveaux.find((n) => n.id === niveauId)
    if (!niveau) return null

    const hasExercises = niveau.exercises.length > 0
    const hasStarted = niveau.lastExerciseIndex !== null
    const targetExercise = hasExercises
        ? niveau.exercises[hasStarted ? (niveau.lastExerciseIndex as number) : 0]
        : undefined
    const startHref = targetExercise
        ? routes.apprenant.modules.exercice(learningModule.slug, niveau.slug, targetExercise.slug)
        : undefined
    const startLabel = hasStarted ? "Continuer l'activité" : "Commencer l'activité"

    return (
        <>
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
            <div className={styles.page}>
                <div className={styles.hero}>
                    <div className={styles.eyebrow}>
                        <span className={styles.difficultyBadge}>{DIFFICULTY_LABELS[niveau.difficulty]}</span>
                        <AudioButton text={[niveau.title, niveau.intro.description].filter(Boolean).join(". ")} />
                    </div>
                    <div>

                        <h1 className={styles.title}>{niveau.title}</h1>
                        <p className={styles.description}>{niveau.intro.description}</p>
                    </div>
                </div>

                <div className={styles.practiceBox}>
                    <div className={styles.practiceHeader}>
                        <span className={styles.practiceTitle}>Ce que vous allez pratiquer</span>
                        <AudioButton text={niveau.intro.practiceItems.join(". ")} />
                    </div>
                    <div className={styles.practiceList}>
                        {niveau.intro.practiceItems.map((item, index) => (
                            <ChecklistItem key={index}>{item}</ChecklistItem>
                        ))}
                    </div>
                </div>

                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <FontAwesomeIcon icon={faLayerGroup} aria-hidden="true" />
                        {niveau.intro.exerciseCount} exercice{niveau.intro.exerciseCount > 1 ? "s" : ""}
                    </span>
                    <span className={styles.metaItem}>
                        <FontAwesomeIcon icon={faClock} aria-hidden="true" />
                        Environ {niveau.intro.durationMinutes} minutes
                    </span>
                    <span className={styles.metaItem}>
                        <FontAwesomeIcon icon={faStar} aria-hidden="true" />
                        Score actuel : {niveau.intro.currentScore ?? "-"}/{niveau.intro.maxScore}
                    </span>
                </div>

                <ScoringLegend />

                <div className={styles.actionRow}>
                    {startHref ? (
                        <Button label={`${startLabel} →`} variant="secondary" size="lg" href={startHref} />
                    ) : (
                        <Button label="Contenu à venir" variant="secondary" size="lg" disabled />
                    )}
                </div>

                <Link href={routes.apprenant.modules.bySlug(learningModule.slug)} className={styles.backLink}>
                    ← Retour au module
                </Link>
            </div>
        </>
    )
}