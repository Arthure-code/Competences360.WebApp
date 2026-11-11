"use server"

import { ADMIN_COOKIE, api } from "@/lib/api"

/** Active ou désactive le compte d'un apprenant, d'un formateur ou d'un gestionnaire. */
export async function setUserAccountActive(
    userId: string,
    userName: string,
    organizationId: string,
    isActive: boolean
): Promise<void> {
    void userName
    void organizationId

    await api.put(
        `/api/utilisateurs/${encodeURIComponent(userId)}/statut`,
        { isActive },
        { cookieName: ADMIN_COOKIE },
    )
}
