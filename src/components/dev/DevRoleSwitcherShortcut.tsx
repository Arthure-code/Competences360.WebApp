"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { setDevSessionKey } from "@/_mocks/devSession.actions"
import { routes } from "@/constants/routes"

/**
 * 1/2/3/4 → bascule de session dev + redirige vers l'accueil du rôle,
 * sans passer par une UI cliquable. Réutilise setDevSessionKey
 * (devSession.actions.ts), le même mécanisme que DevSessionSwitcher,
 * juste un déclencheur différent (clavier plutôt qu'un clic).
 *
 * 4 → accueil gestionnaire (pas formateur) : ce compte cumule les deux
 * rôles, l'accueil gestionnaire est le plus intéressant à tester avec.
 *
 * 0 → accueil public du site, ne touche jamais à la session dev active
 * (contrairement à 1-4), juste une navigation rapide.
 */
const KEY_TO_SESSION: Record<string, { sessionKey: string; home: string }> = {
    "1": { sessionKey: "apprenant", home: routes.apprenant.home },
    "2": { sessionKey: "formateur", home: routes.formateur.home },
    "3": { sessionKey: "gestionnaire", home: routes.gestionnaire.home },
    "4": { sessionKey: "formateurGestionnaire", home: routes.gestionnaire.home },
}

/**
 * Composant à retirer avant la mise en production, ne se rend déjà que si
 * NODE_ENV === "development", mais un raccourci clavier qui change
 * l'identité de session ne doit jamais exister en prod.
 */
export default function DevRoleSwitcherShortcut() {
    const router = useRouter()

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return

        function handleKeyDown(event: KeyboardEvent) {
            // Ne jamais intercepter pendant une saisie, sinon écrire "1234"
            // dans un champ de formulaire basculerait la session par accident.
            const target = event.target as HTMLElement | null
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.tagName === "SELECT" ||
                target?.isContentEditable
            if (isTyping) return

            if (event.key === "0") {
                router.push(routes.public.home)
                return
            }

            const mapping = KEY_TO_SESSION[event.key]
            if (!mapping) return

            setDevSessionKey(mapping.sessionKey).then(() => {
                router.push(mapping.home)
                router.refresh()
            })
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [router])

    return null
}