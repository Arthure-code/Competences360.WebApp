import type { Role } from "@/constants/roles"

/**
 * Concept entièrement neuf — aucune route backend n'existe, même
 * partiellement (contrairement à organizations/configuration, qui
 * avaient au moins la lecture). Vit uniquement dans _mocksToMigrate/ dès
 * le départ, pas de tentative d'appel réel à essayer en premier ici —
 * rien à essayer, rien n'existe.
 */

export type ReportType = "probleme_technique" | "facturation" | "contenu_inapproprie" | "comportement" | "autre"
export type ReportStatus = "en_attente" | "en_cours" | "resolu"
export type ReportPriority = "faible" | "normale" | "urgente"

export interface ReportMessage {
    id: string
    authorId: string
    authorName: string
    /** true = un admin a écrit ce message — distingue visuellement dans le fil */
    isAdmin: boolean
    text: string
    createdAt: string
}

export interface Report {
    id: string
    /** Court résumé du problème, distinct du message complet — sert l'affichage en liste, même esprit qu'un sujet d'email ou un titre d'issue GitHub */
    title: string
    submittedByUserId: string
    submittedByName: string
    submittedByRole: Role
    /** Absent si soumis par un compte sans organisation */
    organizationId?: string
    organizationName?: string
    type: ReportType
    priority: ReportPriority
    status: ReportStatus
    /** Fil de discussion complet, chronologique — voir ReportMessage */
    messages: ReportMessage[]
    /** Admin qui s'est attribué ce signalement — optionnel, "prendre en charge" */
    claimedByAdminId?: string
    claimedByAdminName?: string
    createdAt: string
    resolvedAt?: string
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    probleme_technique: "Problème technique",
    facturation: "Facturation",
    contenu_inapproprie: "Contenu inapproprié",
    comportement: "Comportement",
    autre: "Autre",
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    en_attente: "En attente",
    en_cours: "En cours",
    resolu: "Résolu",
}

export const REPORT_PRIORITY_LABELS: Record<ReportPriority, string> = {
    faible: "Faible",
    normale: "Normale",
    urgente: "Urgente",
}