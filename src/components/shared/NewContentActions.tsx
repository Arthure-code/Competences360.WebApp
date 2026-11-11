"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import {
    createModuleFromScratch,
    createModuleFromGlobal,
    createModuleFromOrgVersion,
    getForkableModules,
} from "@/_mocks/moduleVersions.actions"
import { getForkableOrgVersions, type ForkableOrgVersion } from "@/lib/contentSharing"
import { getCategoriesForOrganization } from "@/_mocks/categories.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { getFullName } from "@/lib/user"
import { getCurrentSession } from "@/_mocks/users.mock"
import { routes } from "@/constants/routes"
import ForkModulePicker, { type ForkSelection } from "@/components/shared/ForkModulePicker"
import type { PlatformTemplate } from "@/_mocks/platformTemplates.mock"
import type { Category } from "@/types/category"
import type { ModuleVersionContent } from "@/types/moduleVersion"
import styles from "./NewContentActions.module.css"

interface NewContentActionsProps {
    organizationId: string
    userId: string
    /** Choisit routes.formateur.contenu ou routes.gestionnaire.contenu — sinon un gestionnaire qui crée du contenu était redirigé vers les routes de formateur par erreur */
    role: "formateur" | "gestionnaire"
}

/** externalLinks: [] ajouté — ModuleVersionContent l'exige maintenant (voir types/moduleVersion.ts), sans ça un module créé "from scratch" ici plantait à l'affichage (champ manquant plutôt que vide). */
const EMPTY_CONTENT: ModuleVersionContent = {
    title: "",
    description: "",
    categoryId: "",
    niveaux: [],
    externalLinks: [],
}

/**
 * Trois points d'entrée Create — de A à Z, depuis le catalogue global
 * (nouveau ContentModule avec forkedFromGlobalModuleId), ou depuis du
 * contenu déjà partagé/officiel de l'org (réutiliser le travail d'un
 * collègue pour le personnaliser, pas seulement l'assigner tel quel —
 * voir createModuleFromOrgVersion, moduleVersions.actions.ts). Les trois
 * redirigent directement vers l'éditeur de la première version créée.
 *
 * globalModules : PlatformTemplate[] (platformTemplates.mock.ts) depuis le
 * retrait de l'ancien système (modules.mock.ts). ⚠️ ForkModulePicker.tsx, consommateur de ce state,
 * pas encore corrigé pour cette nouvelle forme (Module[] → 
 * PlatformTemplate[]) — voir le commentaire sur son prop plus bas.
 */
export default function NewContentActions({ organizationId, userId, role }: NewContentActionsProps) {
    const router = useRouter()
    const contenuRoutes = routes[role].contenu
    const [isForkPickerOpen, setForkPickerOpen] = useState(false)
    const [globalModules, setGlobalModules] = useState<PlatformTemplate[]>([])
    const [orgVersions, setOrgVersions] = useState<ForkableOrgVersion[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingForkable, setIsLoadingForkable] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    async function handleCreateFromScratch() {
        setIsCreating(true)
        const { user } = await getCurrentSession()
        const { module, version } = await createModuleFromScratch({
            organizationId,
            createdByUserId: userId,
            createdByName: getFullName(user),
            changeNote: "Création initiale",
            content: EMPTY_CONTENT,
        })
        router.push(contenuRoutes.edit(module.id, version.id))
    }

    async function handleOpenForkPicker() {
        setForkPickerOpen(true)
        setIsLoadingForkable(true)
        const organization = await getOrganizationById(organizationId)
        const [global, org, allCategories] = await Promise.all([
            getForkableModules(organizationId),
            getForkableOrgVersions(organizationId, organization?.name ?? "l'organisation"),
            getCategoriesForOrganization(organizationId),
        ])
        setGlobalModules(global)
        setOrgVersions(org)
        setCategories(allCategories)
        setIsLoadingForkable(false)
    }

    async function handleForkSelect(selection: ForkSelection) {
        const { user } = await getCurrentSession()

        const result =
            selection.source === "global"
                ? await createModuleFromGlobal({
                      sourceGlobalModuleId: selection.sourceId,
                      organizationId,
                      createdByUserId: userId,
                      createdByName: getFullName(user),
                      changeNote: "Version initiale",
                  })
                : await createModuleFromOrgVersion({
                      sourceVersionId: selection.sourceId,
                      organizationId,
                      createdByUserId: userId,
                      createdByName: getFullName(user),
                      changeNote: "Version initiale",
                  })

        if (result) router.push(contenuRoutes.edit(result.module.id, result.version.id))
    }

    return (
        <div className={styles.actions}>
            <Button label="Créer depuis un module existant" variant="outline" onClick={handleOpenForkPicker} />
            <Button
                label={isCreating ? "Création..." : "+ Créer un module"}
                onClick={handleCreateFromScratch}
                disabled={isCreating}
            />

            <Modal
                isOpen={isForkPickerOpen}
                onClose={() => setForkPickerOpen(false)}
                ariaLabel="Créer une nouvelle version depuis un module existant"
                maxWidth={560}
            >
                <h2 className={styles.modalTitle}>Choisir un module source</h2>
                {isLoadingForkable ? (
                    <p className={styles.loading}>Chargement...</p>
                ) : (
                    <ForkModulePicker
                        globalModules={globalModules}
                        orgVersions={orgVersions}
                        categories={categories}
                        onSelect={handleForkSelect}
                    />
                )}
            </Modal>
        </div>
    )
}