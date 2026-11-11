import { ADMIN_COOKIE, api, apiTolerant } from "@/lib/api"
import type { AdminUser } from "@/types/adminUser"

export interface AdminSession {
    admin: AdminUser
}

/** Retourne la session d'administration en cours. Retourne null si elle est absente ou si le compte est désactivé. */
export async function getCurrentAdminSession(): Promise<AdminSession | null> {
    const admin = await apiTolerant(
        () => api.get<AdminUser | null>("/api/admin/comptes/moi", { cookieName: ADMIN_COOKIE }),
        null,
    )

    if (!admin || !admin.isActive) return null

    return { admin }
}

/** Retourne tous les comptes d'administration, actifs ou non, triés par nom. */
export async function getAllAdmins(): Promise<AdminUser[]> {
    return await apiTolerant(
        () => api.get<AdminUser[]>("/api/admin/comptes", { cookieName: ADMIN_COOKIE }),
        [],
    )
}
