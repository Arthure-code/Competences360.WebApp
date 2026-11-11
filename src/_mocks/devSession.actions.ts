"use server"

import { cookies } from "next/headers"

/**
 * Sélecteur de session dev — n'existe que pour tester le front avant que
 * l'authentification réelle soit branchée (voir getCurrentSession,
 * users.mock.ts). Un cookie plutôt qu'une variable en mémoire : doit être
 * lisible par les Server Components (pages) ET modifiable depuis un clic
 * client (DevSessionSwitcher) ou un raccourci clavier
 * (DevRoleSwitcherShortcut) — le même problème serveur/client qu'ailleurs
 * dans ce projet, mais un cookie le contourne proprement ici puisqu'il
 * traverse les deux mondes nativement.
 *
 *   Composant/action à retirer avant la mise en production (voir
 * DevSessionSwitcher.tsx et DevRoleSwitcherShortcut.tsx, qui ne se
 * rendent déjà que si NODE_ENV === "development").
 */

const DEV_SESSION_COOKIE = "dev-session-key"

export async function setDevSessionKey(key: string | null): Promise<void> {
    const cookieStore = await cookies()
    if (key === null) {
        cookieStore.delete(DEV_SESSION_COOKIE)
    } else {
        cookieStore.set(DEV_SESSION_COOKIE, key, { path: "/" })
    }
}
