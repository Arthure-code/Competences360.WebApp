"use server"

import { api } from "@/lib/api"
import type { PlatformConfiguration } from "@/types/configuration"

/** Retourne les règles chiffrées de la plateforme. */
export async function getPlatformConfiguration(): Promise<PlatformConfiguration> {
    return await api.get<PlatformConfiguration>(
        "/api/configuration", { tags: ["configuration"], anonymous: true })
}
