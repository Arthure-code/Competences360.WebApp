import { cookies } from "next/headers"
import { DEFAULT_API_ORIGIN } from "@/constants/apiOrigin"

/** Nom du cookie de session émis par l'API pour les espaces apprenant, formateur et gestionnaire. */
export const AUTH_COOKIE = ".Competences360.Auth"

/** Nom du cookie de session émis par l'API pour la console d'administration. */
export const ADMIN_COOKIE = ".Competences360.Admin"

/** Statuts HTTP que le front traite différemment d'une panne. */
export const StatutHttp = {
    RequeteInvalide: 400,
    NonAuthentifie: 401,
    Interdit: 403,
    Introuvable: 404,
} as const

/** Retourne l'origine de l'API, celle de `API_BASE_URL` si elle est définie. */
export function apiBaseUrl(): string {
    return process.env.API_BASE_URL ?? DEFAULT_API_ORIGIN
}

/** Échec d'un appel à l'API. Porte le statut HTTP, le code métier et le corps de la réponse. */
export class ApiError extends Error {
    readonly status: number
    readonly code?: string
    readonly payload?: unknown

    constructor(status: number, message: string, code?: string, payload?: unknown) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.code = code
        this.payload = payload
    }
}

interface RequestOptions {
    method?: string
    body?: unknown
    /** Envoie la requête sans cookie de session. */
    anonymous?: boolean
    /** Étiquettes de cache Next. Une lecture taguée doit être anonyme. */
    tags?: string[]
    /** Cookie à relayer. Sans lui, la session d'administration est envoyée si elle existe (elle n'existe que sur les pages de la console), sinon la session normale. */
    cookieName?: string
}

/** Valeur et expiration d'un cookie lu dans une réponse. L'expiration est nulle pour un cookie de session. */
export interface CookieDeReponse {
    valeur: string
    expiration: Date | null
}

/** Extrait un cookie des en-têtes `Set-Cookie` d'une réponse. Retourne null s'il est absent. */
export function lireCookieDeReponse(response: Response, nom: string): CookieDeReponse | null {
    const brut = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie") ?? ""]

    for (const entree of brut) {
        if (!entree) continue

        const segments = entree.split(";")
        const paire = segments[0]
        const separateur = paire.indexOf("=")
        if (separateur === -1) continue

        if (paire.slice(0, separateur).trim() !== nom) continue

        return {
            valeur: paire.slice(separateur + 1).trim(),
            expiration: lireExpiration(segments),
        }
    }

    return null
}

function lireExpiration(segments: string[]): Date | null {
    for (const segment of segments.slice(1)) {
        const coupure = segment.indexOf("=")
        if (coupure === -1) continue

        if (segment.slice(0, coupure).trim().toLowerCase() !== "expires") continue

        const date = new Date(segment.slice(coupure + 1).trim())
        return Number.isNaN(date.getTime()) ? null : date
    }

    return null
}

async function authHeader(cookieName?: string): Promise<Record<string, string>> {
    const store = await cookies()

    if (cookieName) {
        const valeur = store.get(cookieName)?.value
        return valeur ? { Cookie: `${cookieName}=${valeur}` } : {}
    }

    for (const nom of [ADMIN_COOKIE, AUTH_COOKIE]) {
        const valeur = store.get(nom)?.value
        if (valeur) return { Cookie: `${nom}=${valeur}` }
    }

    return {}
}

async function toApiError(
    response: Response,
    method: string,
    path: string,
): Promise<ApiError> {
    let payload: unknown
    let message = `${method} ${path} : ${response.status} ${response.statusText}`
    let code: string | undefined

    try {
        const text = await response.text()
        if (text) {
            payload = JSON.parse(text)
            const problem = payload as { title?: string; detail?: string; code?: string }
            const detail = problem.detail ?? problem.title
            if (detail) message = `${method} ${path} : ${detail}`
            code = problem.code
        }
    } catch {
        payload = undefined
    }

    return new ApiError(response.status, message, code, payload)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, anonymous = false, tags, cookieName } = options

    if (tags && !anonymous) {
        throw new Error(
            `${path} déclare des tags de cache mais envoie la session. ` +
            `Une lecture mise en cache doit être anonyme.`,
        )
    }

    const segmentVide = path.split("?")[0].split("/").slice(1).some(s => s.length === 0)

    if (segmentVide) {
        throw new ApiError(
            StatutHttp.Introuvable,
            `${method} ${path} : segment vide dans le chemin, un identifiant ` +
            `manque à l'appelant. Requête non envoyée.`,
        )
    }

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(anonymous ? {} : await authHeader(cookieName)),
    }

    if (body !== undefined) headers["Content-Type"] = "application/json"

    const response = await fetch(`${apiBaseUrl()}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: tags ? "force-cache" : "no-store",
        next: tags ? { tags } : undefined,
    })

    if (!response.ok) throw await toApiError(response, method, path)

    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return null as T
    }

    const text = await response.text()
    return (text ? JSON.parse(text) : null) as T
}

/** Exécute `call` et retourne `fallback` si l'erreur porte un des statuts tolérés. Relance les autres. */
export async function apiTolerant<T>(
    call: () => Promise<T>,
    fallback: T,
    tolerated: number[] = [
        StatutHttp.NonAuthentifie,
        StatutHttp.Interdit,
        StatutHttp.Introuvable,
    ],
): Promise<T> {
    try {
        return await call()
    } catch (error) {
        if (error instanceof ApiError && tolerated.includes(error.status)) {
            return fallback
        }
        throw error
    }
}

export const api = {
    get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "GET" }),

    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "POST", body }),

    put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "PUT", body }),

    delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "DELETE" }),

    /** Téléverse un fichier en multipart. Le `Content-Type` est laissé au runtime, qui y ajoute la frontière. */
    upload: async <T>(path: string, form: FormData): Promise<T> => {
        const response = await fetch(`${apiBaseUrl()}${path}`, {
            method: "POST",
            headers: { Accept: "application/json", ...(await authHeader()) },
            body: form,
            cache: "no-store",
        })

        if (!response.ok) throw await toApiError(response, "POST", path)

        const text = await response.text()
        return (text ? JSON.parse(text) : null) as T
    },
}
