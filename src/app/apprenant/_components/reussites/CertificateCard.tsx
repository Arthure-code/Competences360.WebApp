import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { resolveIcon } from "@/lib/iconRegistry"
import Card from "@/components/ui/Card"
import CategoryTag from "@/components/shared/CategoryTag"
import { formatLongDateLabel } from "@/lib/date"
import type { CertificateDisplay } from "@/lib/rewards"
import type { Category } from "@/types/category"
import styles from "./CertificateCard.module.css"

interface CertificateCardProps {
    display: CertificateDisplay
    category?: Category
}

const CERTIFICATE_ICON = "faCertificate"
const FALLBACK_COLOR = "#6E6E73"

export default function CertificateCard({ display, category }: CertificateCardProps) {
    return (
        <Card padding="lg" className={styles.card}>
            <div className={styles.header}>
                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={resolveIcon(CERTIFICATE_ICON)} aria-hidden="true" />
                </div>
                <div className={styles.headerText}>
                    <h3 className={styles.title}>{display.title}</h3>
                    <CategoryTag
                        label={category?.label ?? "Catégorie"}
                        color={category?.color ?? FALLBACK_COLOR}
                        iconName={category?.iconName ?? "faTag"}
                    />
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Niveaux</span>
                    <span className={styles.statValue}>{display.niveauxCompletedCount} complétés</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Score</span>
                    <span className={styles.statValue}>{display.averageScorePercent}%</span>
                </div>
            </div>

            {/* earnedAt optionnel par prudence (voir lib/rewards.ts) — ligne masquée seulement quand vraiment absent, jamais une fausse date affichée */}
            {display.earnedAt && <p className={styles.date}>Obtenu le {formatLongDateLabel(display.earnedAt)}</p>}
        </Card>
    )
}