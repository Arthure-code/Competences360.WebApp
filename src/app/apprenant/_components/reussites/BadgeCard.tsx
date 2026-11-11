import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { resolveIcon } from "@/lib/iconRegistry"
import Card from "@/components/ui/Card"
import CategoryTag from "@/components/shared/CategoryTag"
import { formatLongDateLabel } from "@/lib/date"
import type { BadgeDisplay } from "@/lib/rewards"
import type { Category } from "@/types/category"
import styles from "./BadgeCard.module.css"

interface BadgeCardProps {
    display: BadgeDisplay
    category?: Category
}

const BADGE_ICON = "faMedal"
const FALLBACK_COLOR = "#6E6E73"

export default function BadgeCard({ display, category }: BadgeCardProps) {
    return (
        <Card padding="md" className={styles.card}>
            <div className={styles.header}>
                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={resolveIcon(BADGE_ICON)} aria-hidden="true" />
                </div>
                <div className={styles.headerText}>
                    <h3 className={styles.title}>{display.title}</h3>
                    <p className={styles.subtitle}>{display.subtitle}</p>
                </div>
            </div>

            <div className={styles.footer}>
                <CategoryTag
                    label={category?.label ?? "Catégorie"}
                    color={category?.color ?? FALLBACK_COLOR}
                    iconName={category?.iconName ?? "faTag"}
                />
                <span className={styles.score}>
                    {display.score}/{display.maxScore}
                </span>
            </div>

            {/* earnedAt optionnel par prudence (voir lib/rewards.ts) — ligne masquée seulement quand vraiment absent, jamais une fausse date affichée */}
            {display.earnedAt && <p className={styles.date}>{formatLongDateLabel(display.earnedAt)}</p>}
        </Card>
    )
}