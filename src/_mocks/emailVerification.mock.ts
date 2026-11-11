"use server"

import { api, apiTolerant } from "@/lib/api"

/**
 * Validité d'un lien de vérification de courriel, branchée sur
 * GET /api/verification/validate.
 *
 * L'API ne rend qu'un booléen : associer un courriel à un jeton
 * permettrait de découvrir à qui il appartient en essayant des jetons. Le
 * jeton n'est pas consommé ici, la confirmation qui suit s'en charge.
 */
export async function getEmailVerificationToken(token: string): Promise<{ token: string } | undefined> {
    const jeton = token.trim()
    if (!jeton) return undefined

    const resultat = await apiTolerant(
        () => api.get<{ isValid: boolean }>(
            `/api/verification/validate?token=${encodeURIComponent(jeton)}`,
            { anonymous: true },
        ),
        { isValid: false },
    )

    return resultat.isValid ? { token: jeton } : undefined
}