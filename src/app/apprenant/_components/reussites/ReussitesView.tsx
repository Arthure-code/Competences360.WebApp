"use client"

import PageHeader from "@/components/ui/PageHeader"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import StatGrid from "@/components/ui/StatGrid"
import CertificateCard from "@/app/apprenant/_components/reussites/CertificateCard"
import BadgeCard from "@/app/apprenant/_components/reussites/BadgeCard"
import MomentFortTimeline from "@/app/apprenant/_components/reussites/MomentFortTimeline"
import ReussitesEmptyState from "@/app/apprenant/_components/reussites/ReussitesEmptyState"
import { useHydratedModules } from "@/hooks/useHydratedModules"
import {
    getBadges,
    getCertificates,
    getMomentsForts,
    getBadgeDisplay,
    getCertificateDisplay,
    getMomentFortDisplay,
} from "@/lib/rewards"
import type { AssignedModuleResult } from "@/lib/assignedModules"
import type { BadgeDisplay, CertificateDisplay, MomentFortDisplay } from "@/lib/rewards"
import type { Category } from "@/types/category"
import type { Reward } from "@/types/reward"
import styles from "./ReussitesView.module.css"

interface ReussitesViewProps {
    assignedResults: AssignedModuleResult[]
    categories: Category[]
    /** Liste servie par /api/rewards/mine : badges, certificats et moments forts melanges. */
    rewards: Reward[]
}

/**
 * Historique des accomplissements de l'apprenant.
 *
 * Ce qui merite un badge, un certificat ou un moment fort est decide par le
 * serveur au moment ou la progression avance. Cette vue trie la liste recue par
 * type et resout les identifiants en libelles ; elle ne decide de rien.
 *
 * Une recompense dont le module ou l'activite n'existe plus rend null et sort
 * de la liste, plutot que d'interrompre le rendu.
 */
export default function ReussitesView({ assignedResults, categories, rewards }: ReussitesViewProps) {
    const modules = useHydratedModules(assignedResults)

    const badgeDisplays: BadgeDisplay[] = getBadges(rewards)
        .map((badge) => getBadgeDisplay(badge, modules))
        .filter((display): display is BadgeDisplay => display !== null)

    const certificateDisplays: CertificateDisplay[] = getCertificates(rewards)
        .map((certificate) => getCertificateDisplay(certificate, modules))
        .filter((display): display is CertificateDisplay => display !== null)

    // Du plus recent au plus ancien : la frise se lit de haut en bas.
    const momentFortDisplays: MomentFortDisplay[] = getMomentsForts(rewards)
        .map(getMomentFortDisplay)
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())

    const hasNothing = badgeDisplays.length === 0 && certificateDisplays.length === 0 && momentFortDisplays.length === 0

    if (hasNothing) {
        return (
            <div className={styles.page}>
                <PageHeader title="Mes réussites" subtitle="Votre historique complet d'accomplissements" />
                <ReussitesEmptyState />
            </div>
        )
    }

    const statsItems = [
        { id: "badges", label: "Badges", value: badgeDisplays.length, icon: "faAward" },
        { id: "certificates", label: "Certificats", value: certificateDisplays.length, icon: "faGraduationCap" },
        { id: "moments", label: "Moments forts", value: momentFortDisplays.length, icon: "faBolt" },
    ]

    return (
        <div className={styles.page}>
            <PageHeader title="Mes réussites" subtitle="Votre historique complet d'accomplissements" />

            <StatGrid items={statsItems} columns={3} />

            {certificateDisplays.length > 0 && (
                <CollapsibleSection title="Certificats" count={certificateDisplays.length} className={styles.section}>
                    <div className={styles.certificateGrid}>
                        {certificateDisplays.map((display, index) => (
                            <CertificateCard
                                key={index}
                                display={display}
                                category={categories.find((c) => c.id === display.categoryId)}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {badgeDisplays.length > 0 && (
                <CollapsibleSection title="Badges" count={badgeDisplays.length} className={styles.section}>
                    <div className={styles.badgeGrid}>
                        {badgeDisplays.map((display, index) => (
                            <BadgeCard
                                key={index}
                                display={display}
                                category={categories.find((c) => c.id === display.categoryId)}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {momentFortDisplays.length > 0 && (
                <CollapsibleSection title="Moments forts" count={momentFortDisplays.length} className={styles.section}>
                    <MomentFortTimeline items={momentFortDisplays} />
                </CollapsibleSection>
            )}
        </div>
    )
}