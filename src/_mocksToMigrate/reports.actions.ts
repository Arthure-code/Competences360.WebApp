"use server"

import { ADMIN_COOKIE, AUTH_COOKIE, ApiError, StatutHttp, api } from "@/lib/api"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import type { ReportStatus, ReportType, ReportPriority } from "@/types/report"
import type { Role } from "@/constants/roles"

interface CreateReportInput {
    title: string
    submittedByUserId: string
    submittedByName: string
    submittedByRole: Role
    organizationId?: string
    organizationName?: string
    type: ReportType
    message: string
}

/** Exécute un appel et traduit son échec en message. */
async function resultat(appel: Promise<unknown>): Promise<{ success: boolean; error?: string }> {
    try {
        await appel
        return { success: true }
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
        if (error.status === StatutHttp.NonAuthentifie) return { success: false, error: "Non autorisé." }
        if (error.status === StatutHttp.Introuvable) return { success: false, error: "Signalement introuvable." }
        return { success: false, error: error.message }
    }
}

/** Dépose un signalement au nom du compte connecté (POST /api/signalements). */
export async function createReport(input: CreateReportInput): Promise<void> {
    await api.post("/api/signalements", {
        title: input.title,
        submittedByRole: input.submittedByRole,
        type: input.type,
        message: input.message,
    }, { cookieName: AUTH_COOKIE })
}

/** Change le statut d'un signalement. Réservé aux admins. */
export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<{ success: boolean; error?: string }> {
    return await resultat(api.put(
        `/api/signalements/${encodeURIComponent(reportId)}/statut`, { status }, { cookieName: ADMIN_COOKIE }))
}

/** Change la priorité d'un signalement. Réservé aux admins. */
export async function updateReportPriority(reportId: string, priority: ReportPriority): Promise<{ success: boolean; error?: string }> {
    return await resultat(api.put(
        `/api/signalements/${encodeURIComponent(reportId)}/priorite`, { priority }, { cookieName: ADMIN_COOKIE }))
}

/** Attribue le signalement à l'admin de la session. Réservé aux admins. */
export async function claimReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    return await resultat(api.put(
        `/api/signalements/${encodeURIComponent(reportId)}/prise-en-charge`, undefined, { cookieName: ADMIN_COOKIE }))
}

/** Ajoute un message au fil, au nom de l'admin s'il y a une session d'administration, du signaleur sinon. */
export async function addReportMessage(
    reportId: string,
    authorId: string,
    authorName: string,
    text: string
): Promise<{ success: boolean; error?: string }> {
    void authorId
    void authorName
    const adminSession = await getCurrentAdminSession()

    return await resultat(api.post(
        `/api/signalements/${encodeURIComponent(reportId)}/messages`,
        { text },
        { cookieName: adminSession ? ADMIN_COOKIE : AUTH_COOKIE },
    ))
}
