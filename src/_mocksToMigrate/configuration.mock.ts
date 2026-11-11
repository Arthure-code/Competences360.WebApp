import { getPlatformConfiguration } from "@/_mocks/configuration.mock"
import type { PlatformConfiguration } from "@/types/configuration"

/** Réglages en vigueur, servis par GET /api/configuration. */
export async function getPlatformConfigurationWithOverride(): Promise<PlatformConfiguration> {
    return await getPlatformConfiguration()
}
