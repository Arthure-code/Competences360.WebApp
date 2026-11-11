"use server"

import { ADMIN_COOKIE, AUTH_COOKIE, api, apiTolerant } from "@/lib/api"
import type { Report } from "@/types/report"

/** Plus récents en premier. */
export async function getAllReports(): Promise<Report[]> {
    return await apiTolerant(
        () => api.get<Report[]>("/api/signalements", { cookieName: ADMIN_COOKIE }),
        [],
    )
}

/** Un signalement et son fil, ou undefined s'il est introuvable. */
export async function getReportById(reportId: string): Promise<Report | undefined> {
    const report = await apiTolerant(
        () => api.get<Report | null>(`/api/signalements/${encodeURIComponent(reportId)}`, { cookieName: ADMIN_COOKIE }),
        null,
    )

    return report ?? undefined
}

/** Tous les signalements liés à une org précise — sert un futur onglet "Signalements" dans le détail d'org. */
export async function getReportsForOrganization(organizationId: string): Promise<Report[]> {
    const reports = await getAllReports()
    return reports.filter((r) => r.organizationId === organizationId)
}

/** Les signalements du compte connecté — sert "Mes signalements" (ReportProblemButton.tsx). */
export async function getReportsBySubmitter(userId: string): Promise<Report[]> {
    void userId

    return await apiTolerant(
        () => api.get<Report[]>("/api/signalements/mes-signalements", { cookieName: AUTH_COOKIE }),
        [],
    )
}
