"use server"

import { cookies } from "next/headers"
import { AUTH_COOKIE, ApiError, apiBaseUrl, api, lireCookieDeReponse } from "@/lib/api"

export interface LoginResult {
    success: boolean
    mustChangePassword: boolean
    error?: string
    /** Fin du verrouillage (date ISO) quand le compte est verrouillé après trop de tentatives. */
    lockoutEnd?: string
}

interface AuthResultPayload {
    success: boolean
    id?: number | string | null
    role?: string | null
    organizationId?: number | string | null
    mustChangePassword: boolean
    errors: string[]
}

/** Authentifie et pose le cookie de session sur le domaine du front. L'expiration est celle émise par l'API. */
export async function login(
    userName: string,
    password: string,
    rememberMe = false,
): Promise<LoginResult> {
    let response: Response

    try {
        response = await fetch(`${apiBaseUrl()}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ userName, password, rememberMe }),
            cache: "no-store",
        })
    } catch {
        return {
            success: false,
            mustChangePassword: false,
            error: "Service indisponible. Réessayez dans un instant.",
        }
    }

    if (!response.ok) {
        const corps = (await response.json().catch(() => null)) as { lockoutEnd?: string | null } | null

        return {
            success: false,
            mustChangePassword: false,
            error: corps?.lockoutEnd ? undefined : "Identifiant ou mot de passe incorrect.",
            lockoutEnd: corps?.lockoutEnd ?? undefined,
        }
    }

    const session = lireCookieDeReponse(response, AUTH_COOKIE)

    if (!session) {
        return {
            success: false,
            mustChangePassword: false,
            error: "La session n'a pas pu être ouverte. Réessayez.",
        }
    }

    const store = await cookies()
    store.set(AUTH_COOKIE, session.valeur, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        expires: session.expiration ?? undefined,
    })

    const payload = (await response.json().catch(() => null)) as AuthResultPayload | null

    return {
        success: true,
        mustChangePassword: payload?.mustChangePassword ?? false,
    }
}

/** Ferme la session côté API, puis efface le cookie du front. */
export async function logout(): Promise<void> {
    try {
        await api.post("/api/auth/logout")
    } catch (error) {
        if (!(error instanceof ApiError)) throw error
    }

    const store = await cookies()
    store.delete(AUTH_COOKIE)
}

/** Indique si un cookie de session existe. Ne dit rien de sa validité. */
export async function hasSessionCookie(): Promise<boolean> {
    const store = await cookies()
    return store.get(AUTH_COOKIE) !== undefined
}
