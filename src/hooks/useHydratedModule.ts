"use client"

import { useHydratedModules } from "@/hooks/useHydratedModules"
import type { Module } from "@/types/module"

/**
 * Mince wrapper autour de useHydratedModules (pluriel) pour le cas d'un
 * seul module — évite de dupliquer la logique d'écoute focus/
 * visibilitychange une 2e fois pour ce cas singulier.
 *
 * niveauDueDates optionnel (épopée 5 — assignation par activité) : les
 * appelants existants (ModuleDetailView, NiveauIntroView, BilanView) ne le
 * passent pas encore — à ajouter le jour où ces pages lisent
 * AssignedModuleResult.niveauDueDates au lieu de juste .dueDate.
 */
export function useHydratedModule(initialModule: Module, dueDate?: string, niveauDueDates?: Record<string, string>): Module {
    const [hydrated] = useHydratedModules([{ module: initialModule, dueDate, niveauDueDates }])
    return hydrated
}