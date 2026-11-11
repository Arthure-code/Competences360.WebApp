"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash, faLink } from "@fortawesome/free-solid-svg-icons"
import PageSubheader from "@/components/ui/PageSubheader"
import type { ExternalLink } from "@/types/externalLink"
import styles from "./ExternalLinksPanel.module.css"

interface ExternalLinksPanelProps {
    links: ExternalLink[]
    onChange: (links: ExternalLink[]) => void
    readOnly?: boolean
}

/**
 * Même patron que ModuleInfoPanel — un panneau de plus, sélectionnable
 * depuis NiveauSidebar, pas une activité ni un exercice. Titre + URL par
 * lien, aucune mécanique de correction : juste une liste affichée telle
 * quelle côté apprenant (voir ModuleDetailView.tsx), chaque clic ouvre
 * l'URL dans un nouvel onglet.
 */
export default function ExternalLinksPanel({ links, onChange, readOnly = false }: ExternalLinksPanelProps) {
    function addLink() {
        onChange([...links, { id: crypto.randomUUID(), title: "", url: "" }])
    }

    function updateLink(id: string, patch: Partial<ExternalLink>) {
        onChange(links.map((link) => (link.id === id ? { ...link, ...patch } : link)))
    }

    function removeLink(id: string) {
        onChange(links.filter((link) => link.id !== id))
    }

    return (
        <div className={styles.panel}>
            <PageSubheader title="Liens externes" subtitle="Ressources affichées sous les activités du module." />

            {links.length === 0 && <p className={styles.emptyState}>Aucun lien externe pour l'instant.</p>}

            <div className={styles.linksList}>
                {links.map((link) => (
                    <div key={link.id} className={styles.linkRow}>
                        <FontAwesomeIcon icon={faLink} className={styles.linkIcon} aria-hidden="true" />
                        <div className={styles.linkFields}>
                            <input
                                type="text"
                                value={link.title}
                                onChange={(e) => updateLink(link.id, { title: e.target.value })}
                                className={styles.input}
                                placeholder="Titre du lien"
                                disabled={readOnly}
                            />
                            <input
                                type="url"
                                value={link.url}
                                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                                className={styles.input}
                                placeholder="https://..."
                                disabled={readOnly}
                            />
                        </div>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => removeLink(link.id)}
                                aria-label="Retirer ce lien"
                                className={styles.removeButton}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {!readOnly && (
                <button type="button" className={styles.addButton} onClick={addLink}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Ajouter un lien
                </button>
            )}
        </div>
    )
}
