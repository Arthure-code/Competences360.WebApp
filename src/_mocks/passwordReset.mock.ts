"use server"

import { api, apiTolerant } from "@/lib/api"

/**
 * Indique si un lien de réinitialisation est encore valide, sans le
 * consommer. Rend `undefined` sinon.
 *
 * L'API ne rend qu'un booléen : associer un courriel à un jeton
 * permettrait d'apprendre à qui il appartient en essayant des jetons.
 */
export async function getPasswordResetToken(token: string): Promise<{ token: string } | undefined> {
    const trimmed = token.trim()
    if (!trimmed) return undefined

    const result = await apiTolerant(
        () => api.get<{ isValid: boolean }>(
            `/api/auth/reset-password/validate?token=${encodeURIComponent(trimmed)}`,
            { anonymous: true },
        ),
        { isValid: false },
    )

    return result.isValid ? { token: trimmed } : undefined
}