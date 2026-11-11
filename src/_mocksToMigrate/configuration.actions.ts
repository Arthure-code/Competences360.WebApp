"use server"

import { updateTag } from "next/cache"
import { ADMIN_COOKIE, api } from "@/lib/api"
import type { PlatformConfiguration } from "@/types/configuration"

/** Enregistre les réglages (PUT /api/configuration) et périme leur lecture en cache. */
export async function updatePlatformConfiguration(config: PlatformConfiguration): Promise<void> {
    await api.put("/api/configuration", config, { cookieName: ADMIN_COOKIE })
    updateTag("configuration")
}
