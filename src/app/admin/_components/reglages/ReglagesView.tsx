"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { updatePlatformConfiguration } from "@/_mocksToMigrate/configuration.actions"
import { REGLAGES_FIELDS } from "@/_content/reglagesFields"
import CategoriesManager from "@/components/shared/CategoriesManager"
import type { PlatformConfiguration } from "@/types/configuration"
import type { Category } from "@/types/category"
import styles from "./ReglagesView.module.css"

interface ReglagesViewProps {
    config: PlatformConfiguration
    isRoot: boolean
    /** Catégories "global" + leur usage — n'importe quel Admin peut gérer ça (pas réservé à isRoot, décision distincte des réglages ci-dessus, voir CategoriesManager isAdmin). */
    globalCategories: Category[]
    moduleCounts: Record<string, number>
    adminId: string
}

/**
 * Les 9 vrais champs de PlatformConfiguration (ConfigurationController,
 * _mocks/configuration.mock.ts) — remplace une version précédente qui
 * avait inventé 3 champs sous des noms différents, sans savoir que cette
 * vraie route existait déjà. Écriture encore temporaire (voir
 * configuration.actions.ts, _mocksToMigrate/) — aucune route PUT
 * confirmée côté backend pour l'instant.
 *
 * Visible par TOUS les admins (voir page.tsx) — mais seul un compte
 * racine peut vraiment MODIFIER ces champs. Un non-racine voit les
 * valeurs actuelles (utile en soi, pas besoin de cacher toute la page)
 * mais les champs sont désactivés, avec une bannière explicite plutôt
 * que de deviner pourquoi rien ne répond au clic.
 *
 * Confirmation obligatoire avant d'appliquer — ces réglages affectent
 * TOUTE la plateforme instantanément, pas juste la session en cours.
 */
export default function ReglagesView({ config, isRoot, globalCategories, moduleCounts, adminId }: ReglagesViewProps) {
    const router = useRouter()
    const [form, setForm] = useState(config)
    const [success, setSuccess] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")

    const CONFIRM_PHRASE = "CONFIRMER"

    const changedFields = REGLAGES_FIELDS.filter((field) => form[field.key] !== config[field.key])
    const hasChanged = changedFields.length > 0

    async function handleConfirmSave() {
        setIsSaving(true)
        setSuccess(false)
        await updatePlatformConfiguration(form)
        setIsSaving(false)
        setConfirmOpen(false)
        setConfirmText("")
        setSuccess(true)
        router.refresh()
    }

    return (
        <div className={styles.page}>
            <PageHeader title="Réglages" subtitle="Paramètres globaux de la plateforme." />

            <Card padding="lg" className={styles.card}>
                {!isRoot && (
                    <p className={styles.readOnlyBanner}>
                        🔒 Vous pouvez consulter ces réglages, mais seul un compte racine peut les modifier.
                    </p>
                )}

                {REGLAGES_FIELDS.map((field) => (
                    <label key={field.key} className={styles.field}>
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <input
                            type="number"
                            min={field.min ?? 0}
                            max={field.max}
                            step={field.step ?? 1}
                            value={form[field.key]}
                            onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                            className={styles.input}
                            disabled={!isRoot}
                        />
                        <span className={styles.hint}>{field.hint}</span>
                    </label>
                ))}

                {success && <p className={styles.success}>Réglages enregistrés.</p>}

                {isRoot && <Button label="Enregistrer" onClick={() => setConfirmOpen(true)} disabled={!hasChanged} />}
            </Card>

            {/* Catégories globales — n'importe quel Admin, pas réservé à isRoot (décision distincte des réglages ci-dessus). Créer/renommer libres, supprimer bloqué si utilisée (voir CategoriesManager.tsx, lib/categoryRights.ts). */}
            <CategoriesManager
                categories={globalCategories}
                moduleCounts={moduleCounts}
                organizationId=""
                userId={adminId}
                isGestionnaireOfThisOrg={false}
                canCreate
                isAdmin
                subtitle="Catégories globales, utilisées pour classer le contenu de base de toute la plateforme."
            />

            <Modal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setConfirmOpen(false)
                    setConfirmText("")
                }}
                ariaLabel="Confirmer les changements de réglages"
                maxWidth={460}
            >
                <h2 className={styles.fieldLabel}>Confirmer les changements de réglages ?</h2>
                <p className={styles.hint}>
                    Ces changements s&apos;appliquent immédiatement à TOUTE la plateforme :{" "}
                    {changedFields.map((f) => `${f.label} (${config[f.key]} → ${form[f.key]})`).join(" — ")}
                </p>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        Tapez <strong>{CONFIRM_PHRASE}</strong> pour confirmer
                    </span>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className={styles.input}
                        autoComplete="off"
                    />
                </label>
                <div className={styles.confirmActions}>
                    <Button
                        label="Annuler"
                        variant="outline"
                        onClick={() => {
                            setConfirmOpen(false)
                            setConfirmText("")
                        }}
                    />
                    <Button
                        label={isSaving ? "Enregistrement..." : "Confirmer"}
                        onClick={handleConfirmSave}
                        disabled={confirmText !== CONFIRM_PHRASE || isSaving}
                    />
                </div>
            </Modal>
        </div>
    )
}