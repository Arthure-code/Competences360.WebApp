import styles from "./ModuleDetailTableHeader.module.css"

/** Ligne d'en-têtes de colonnes, rendue une seule fois au-dessus des CollapsibleSection par catégorie — pas répétée dans chacune */
export default function ModuleDetailTableHeader() {
    return (
        <div className={styles.row}>
            <span>Nom du module</span>
            <span className={styles.center}>Progression</span>
            <span className={styles.center}>Moyenne</span>
            <span className={styles.center}>Temps passé</span>
            <span className={styles.right}>Statut</span>
        </div>
    )
}
