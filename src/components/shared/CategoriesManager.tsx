"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen, faTrash, faLock } from "@fortawesome/free-solid-svg-icons"
import Card from "@/components/ui/Card"
import PageSubheader from "@/components/ui/PageSubheader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import IconPicker from "@/components/shared/IconPicker"
import ColorPicker from "@/components/shared/ColorPicker"
import { resolveIcon } from "@/lib/iconRegistry"
import { createCategory, createGlobalCategory, updateCategory, deleteCategory } from "@/_mocks/categories.actions"
import { canEditCategory, canDeleteGlobalCategory } from "@/lib/categoryRights"
import type { Category } from "@/types/category"
import styles from "./CategoriesManager.module.css"

interface CategoriesManagerProps {
    categories: Category[]
    /** moduleId compté par catégorie (voir getModuleCountForCategory, lib/categoryUsage.ts) — sert l'avertissement avant suppression */
    moduleCounts: Record<string, number>
    organizationId: string
    userId: string
    isGestionnaireOfThisOrg: boolean
    /**
     * Contrôle SEULEMENT le bouton "+ Nouvelle catégorie" — distinct de
     * isGestionnaireOfThisOrg (qui contrôle modifier/supprimer une
     * catégorie EXISTANTE, via canEditCategory). Par défaut égal à
     * isGestionnaireOfThisOrg (comportement inchangé pour le
     * gestionnaire). Permet à l'espace Admin de corriger une catégorie
     * existante d'une org (modifier/supprimer) sans pouvoir en créer de
     * nouvelles à sa place — la taxonomie de contenu d'une org reste sa
     * décision, pas celle d'Admin.
     */
    canCreate?: boolean
    /**
     * Appelé après une création/modification/suppression réussie, EN PLUS
     * de router.refresh() — nécessaire quand ce composant vit dans un
     * contexte qui charge ses propres données côté client plutôt que de
     * les recevoir directement d'un Server Component (ex. le modal
     * formateur dans FormateurContenuView.tsx) : router.refresh() seul ne
     * redéclenche jamais un fetch client local, la liste affichée y
     * restait figée sur l'ancien état malgré une vraie création réussie.
     */
    onDataChanged?: () => void
    /**
     * Additif — espace Admin uniquement. Quand true, une catégorie
     * "global" (scope === "global") n'affiche plus le cadenas en lecture
     * seule : Admin peut la modifier/supprimer comme une catégorie
     * normale, SAUF suppression bloquée (pas juste avertie) si elle est
     * encore utilisée par au moins un module (canDeleteGlobalCategory).
     * N'affecte jamais le rendu des catégories org-scopées (scope ===
     * "organisation"), ni le comportement par défaut (false) utilisé par
     * gestionnaire/formateur partout ailleurs.
     */
    isAdmin?: boolean
    /** Additif — remplace le sous-titre par défaut ("Visibles par tout le monde dans votre organisation.") quand fourni, utile pour le contexte Admin (catégories globales de toute la plateforme). */
    subtitle?: string
}

interface FormState {
    id: string | null
    label: string
    description: string
    iconName: string
    color: string
}

const EMPTY_FORM: FormState = { id: null, label: "", description: "", iconName: "faTag", color: "#E8832A" }

/**
 * Épopée 8 — catégories org-scopées. Une catégorie globale (scope:
 * "global") s'affiche toujours en lecture seule (icône cadenas) — la
 * plateforme les gère, pas l'org (voir lib/categoryRights.ts) — SAUF côté
 * Admin (isAdmin === true), où ce composant est réutilisé pour gérer les
 * catégories globales elles-mêmes (voir prop isAdmin ci-dessus). Une
 * catégorie org-scopée n'affiche Modifier/Supprimer que si canEditCategory
 * le permet (créateur, ou n'importe quel gestionnaire de cette org).
 */
export default function CategoriesManager({
    categories,
    moduleCounts,
    organizationId,
    userId,
    isGestionnaireOfThisOrg,
    canCreate,
    onDataChanged,
    isAdmin = false,
    subtitle,
}: CategoriesManagerProps) {
    const router = useRouter()
    const [form, setForm] = useState<FormState | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const canReallyCreate = canCreate ?? isGestionnaireOfThisOrg

    function openCreateForm() {
        setForm({ ...EMPTY_FORM })
    }

    function openEditForm(category: Category) {
        setForm({ id: category.id, label: category.label, description: category.description, iconName: category.iconName, color: category.color })
    }

    async function handleSave() {
        if (!form || !form.label.trim()) return
        setIsSaving(true)
        if (form.id) {
            await updateCategory(
                form.id,
                { label: form.label, description: form.description, iconName: form.iconName, color: form.color },
                userId,
                isGestionnaireOfThisOrg,
                isAdmin
            )
        } else if (isAdmin) {
            await createGlobalCategory({
                label: form.label,
                description: form.description,
                iconName: form.iconName,
                color: form.color,
                createdByUserId: userId,
            })
        } else {
            await createCategory({
                label: form.label,
                description: form.description,
                iconName: form.iconName,
                color: form.color,
                organizationId,
                createdByUserId: userId,
            })
        }
        setIsSaving(false)
        setForm(null)
        onDataChanged?.()
        router.refresh()
    }

    async function handleConfirmDelete() {
        if (!pendingDelete) return
        setIsDeleting(true)
        await deleteCategory(pendingDelete.id, userId, isGestionnaireOfThisOrg, isAdmin)
        setIsDeleting(false)
        setPendingDelete(null)
        onDataChanged?.()
        router.refresh()
    }

    return (
        <Card padding="lg" className={styles.card}>
            <div className={styles.header}>
                <PageSubheader title="Catégories" subtitle={subtitle ?? "Visibles par tout le monde dans votre organisation."} />
                {canReallyCreate && <Button label="+ Nouvelle catégorie" onClick={openCreateForm} />}
            </div>

            <div className={styles.list}>
                {categories.map((category) => {
                    const isGlobal = category.scope === "global"
                    const canEdit = isGlobal ? isAdmin : canEditCategory(category, userId, isGestionnaireOfThisOrg)
                    const usageCount = moduleCounts[category.id] ?? 0
                    const canDelete = isGlobal ? canDeleteGlobalCategory(usageCount) : true

                    return (
                        <div key={category.id} className={styles.row}>
                            <div className={styles.rowIcon} style={{ backgroundColor: category.color }}>
                                <FontAwesomeIcon icon={resolveIcon(category.iconName)} />
                            </div>
                            <div className={styles.rowInfo}>
                                <span className={styles.rowLabel}>{category.label}</span>
                                <span className={styles.rowDescription}>{category.description}</span>
                            </div>
                            {isGlobal && !isAdmin ? (
                                <span className={styles.globalBadge}>
                                    <FontAwesomeIcon icon={faLock} aria-hidden="true" /> Fournie par la plateforme
                                </span>
                            ) : (
                                canEdit && (
                                    <div className={styles.rowActions}>
                                        {isGlobal && !canDelete && (
                                            <span className={styles.usageNote}>
                                                Utilisée par {usageCount} module{usageCount > 1 ? "s" : ""}
                                            </span>
                                        )}
                                        <button type="button" className={styles.iconAction} onClick={() => openEditForm(category)} aria-label="Modifier">
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.iconAction}
                                            onClick={() => setPendingDelete(category)}
                                            disabled={!canDelete}
                                            aria-label={
                                                canDelete
                                                    ? "Supprimer"
                                                    : `Suppression impossible — utilisée par ${usageCount} module${usageCount > 1 ? "s" : ""}`
                                            }
                                            title={
                                                canDelete
                                                    ? undefined
                                                    : `Cette catégorie globale est utilisée par ${usageCount} module${usageCount > 1 ? "s" : ""} — suppression impossible.`
                                            }
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={form !== null} onClose={() => setForm(null)} ariaLabel={form?.id ? "Modifier la catégorie" : "Nouvelle catégorie"} maxWidth={480}>
                {form && (
                    <div className={styles.formContent}>
                        <h2 className={styles.formTitle}>{form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Nom</span>
                            <input
                                type="text"
                                value={form.label}
                                onChange={(e) => setForm({ ...form, label: e.target.value })}
                                className={styles.textInput}
                                placeholder="Ex. Service à la clientèle"
                            />
                        </label>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Description</span>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className={styles.textArea}
                                rows={2}
                            />
                        </label>

                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Icône</span>
                            <IconPicker value={form.iconName} onSelect={(iconName) => setForm({ ...form, iconName })} />
                        </div>

                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Couleur</span>
                            <ColorPicker value={form.color} onSelect={(color) => setForm({ ...form, color })} />
                        </div>

                        <div className={styles.formActions}>
                            <Button label="Annuler" variant="outline" onClick={() => setForm(null)} />
                            <Button
                                label={isSaving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}
                                onClick={handleSave}
                                disabled={!form.label.trim() || isSaving}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title="Supprimer cette catégorie ?"
                message={
                    pendingDelete
                        ? (moduleCounts[pendingDelete.id] ?? 0) > 0
                            ? `« ${pendingDelete.label} » est utilisée par ${moduleCounts[pendingDelete.id]} module${moduleCounts[pendingDelete.id] > 1 ? "s" : ""}. Ces modules n'afficheront plus aucune catégorie une fois « ${pendingDelete.label} » supprimée.`
                            : `« ${pendingDelete.label} » n'est utilisée par aucun module pour l'instant.`
                        : ""
                }
                confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
                cancelLabel="Annuler"
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </Card>
    )
}