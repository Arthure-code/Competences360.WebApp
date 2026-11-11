import PageSubheader from "@/components/ui/PageSubheader"
import { CONTENT_TEXT_LIMITS } from "@/constants/contentLimits"
import type { ModuleVersionContent } from "@/types/moduleVersion"
import type { Category } from "@/types/category"
import styles from "./ModuleInfoPanel.module.css"

interface ModuleInfoPanelProps {
    content: ModuleVersionContent
    categories: Category[]
    onChange: (patch: Partial<ModuleVersionContent>) => void
    readOnly?: boolean
}

/** progressionMode retiré, toujours libre, plus de choix à faire ici. */
export default function ModuleInfoPanel({ content, categories, onChange, readOnly = false }: ModuleInfoPanelProps) {
    return (
        <div className={styles.panel}>
            <PageSubheader title="Infos du module" subtitle="Titre, description et catégorie." />

            <label className={styles.field}>
                <span className={styles.label}>Titre</span>
                <input
                    type="text"
                    value={content.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    className={styles.input}
                    disabled={readOnly}
                />
            </label>

            <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <textarea
                    value={content.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    className={styles.textarea}
                    rows={4}
                    maxLength={CONTENT_TEXT_LIMITS.moduleDescription}
                    disabled={readOnly}
                />
                <span className={styles.charCount}>
                    {content.description.length}/{CONTENT_TEXT_LIMITS.moduleDescription}
                </span>
            </label>

            <label className={styles.field}>
                <span className={styles.label}>Catégorie</span>
                <select
                    value={content.categoryId}
                    onChange={(e) => onChange({ categoryId: e.target.value })}
                    className={styles.select}
                    disabled={readOnly}
                >
                    <option value="" disabled>
                        Choisir une catégorie
                    </option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    )
}