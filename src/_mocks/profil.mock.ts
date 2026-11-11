"use server"

import { api } from "@/lib/api"

/** Numéro de téléphone du compte connecté au format international, ou null (GET /api/users/profile). */
export async function getMonTelephone(): Promise<string | null> {
    const profil = await api.get<{ phoneNumber: string | null }>("/api/users/profile")
    return profil.phoneNumber
}
