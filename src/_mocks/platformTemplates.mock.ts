import type { ModuleVersionContent } from "@/types/moduleVersion"

/**
 * Contenu de base de la plateforme (Compétences 360) — visible et forkable
 * par toute organisation, sans appartenir à aucune (pas de fausse
 * organisation, pas d'organizationId optionnel sur ContentModule).
 *
 * Le registre en dur a disparu : le catalogue vient de l'API
 * (`getForkableModules`, _mocks/moduleVersions.actions.ts, qui appelle
 * GET /api/contentmodules/forkable/{organizationId}). Côté serveur, ce sont
 * les modules sans organisation — c'est l'absence de propriétaire qui les
 * rend forkables, pas un type particulier. L'API écarte au passage ceux que
 * l'organisation a déjà repris, ce que le registre local ne pouvait pas
 * savoir.
 *
 * Ne reste ici que le type, et c'est volontaire : ce fichier est importé par
 * des composants CLIENT (ForkModulePicker, GlobalCatalogCard). Y mettre
 * « use server » ou un appel à lib/api.ts casserait leur build.
 */
export interface PlatformTemplate {
    /** Identifiant stable, utilisé comme forkedFromGlobalModuleId une fois forké */
    id: string
    content: ModuleVersionContent
}