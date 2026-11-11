"use client"

import { createContext, useContext } from "react"
import type { PlatformConfiguration } from "@/types/configuration"

/**
 * Met les règles chiffrées de la plateforme à disposition des composants
 * CLIENT, qui ne peuvent pas appeler l'API directement (lib/api.ts est
 * serveur uniquement, il lit le cookie de session).
 *
 * Un contexte plutôt que des props : ces valeurs sont lues à des endroits
 * dispersés — une carte de corbeille, un compteur de versions, une légende
 * de notation — sans rapport entre eux. Les faire descendre par props
 * traverserait une dizaine de composants qui n'en ont que faire.
 *
 * Alimenté une seule fois, par le layout racine (composant serveur). Un
 * composant client qui lit d'ici lit donc ce que le serveur a répondu pour
 * CETTE requête, pas une constante figée à la compilation.
 */
const ConfigurationContext = createContext<PlatformConfiguration | null>(null)

export default function ConfigurationProvider({
    configuration,
    children,
}: {
    configuration: PlatformConfiguration
    children: React.ReactNode
}) {
    return (
        <ConfigurationContext.Provider value={configuration}>
            {children}
        </ConfigurationContext.Provider>
    )
}

/**
 * Lève si le fournisseur manque, plutôt que de rendre des valeurs par
 * défaut : un écran qui annoncerait « purgé dans 0 jour » parce qu'un
 * layout a été oublié est un bogue silencieux, et c'est précisément ce que
 * ce remplacement cherche à faire disparaître.
 */
export function usePlatformConfiguration(): PlatformConfiguration {
    const configuration = useContext(ConfigurationContext)

    if (configuration === null) {
        throw new Error(
            "usePlatformConfiguration doit être appelé sous ConfigurationProvider (voir app/layout.tsx).")
    }

    return configuration
}