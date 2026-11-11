"use server"

import { api, apiTolerant } from "@/lib/api"
import { assertCompteConnecte } from "@/_mocks/users.mock"
import type { AppNotification } from "@/types/appNotification"

/**
 * Notifications du compte connecté, triées du plus récent au plus ancien.
 * `userId` est conservé pour les points d'appel mais n'est pas envoyé.
 */
export async function getMyNotifications(userId: string): Promise<AppNotification[]> {
    await assertCompteConnecte(userId, "getMyNotifications")

    return await apiTolerant(
        () => api.get<AppNotification[]>("/api/notifications"),
        [],
    )
}