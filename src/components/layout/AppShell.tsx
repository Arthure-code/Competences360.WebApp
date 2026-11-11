"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import MiniFooter from "@/components/layout/MiniFooter"
import NotificationCenter from "@/components/shared/NotificationCenter"
import SpaceSwitcher from "@/components/layout/SpaceSwitcher"
import GlobalSearchResults from "@/components/layout/GlobalSearchResults"
import ReportProblemButton from "@/components/layout/ReportProblemButton"
import { searchFormateur, searchGestionnaire, searchApprenant } from "@/lib/globalSearch"
import { NAVIGATION } from "@/constants/navigation"
import { ROLE_LABELS, type Role } from "@/constants/roles"
import { HIDDEN_TOPBAR_PREFIXES } from "@/constants/layout"
import { routes, ROLE_HOME_PATH } from "@/constants/routes"
import { getFullName } from "@/lib/user"
import { getUnreadCount } from "@/lib/notifications"
import { seDeconnecter } from "@/_mocks/session.actions"
import type { User } from "@/types/user"
import type { AppNotification } from "@/types/appNotification"
import type { SearchResult } from "@/types/searchResult"
import styles from "./AppShell.module.css"

interface AppShellProps {
    /** Détermine la nav, le libellé de rôle affiché et les routes sans topbar — pas "quel rôle a cet utilisateur" (ça vit dans la session) */
    role: Role
    /** Résolu par le layout.tsx serveur (await getCurrentSession()) et passé en prop — AppShell est client, il ne peut pas awaiter lui-même. */
    user: User
    /** Idem, résolu par layout.tsx (await getMyNotifications(user.id)) */
    notifications: AppNotification[]
    /** organizationId du profil actif (formateur/gestionnaire), absent pour un apprenant — nécessaire pour scoper la recherche globale à la bonne org, et pour rattacher un signalement à la bonne org (voir ReportProblemButton) */
    organizationId?: string
    children: React.ReactNode
}

const ACCOUNT_ROUTE_BY_ROLE: Record<Role, string> = {
    apprenant: routes.apprenant.compte,
    formateur: routes.formateur.compte,
    gestionnaire: routes.gestionnaire.compte,
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Shell partagé par les trois espaces (apprenant/formateur/gestionnaire) :
 * même structure (Sidebar, Topbar, contenu, footer, centre de
 * notifications), seule la donnée change par rôle. La recherche globale
 * vit ici (pas dans Topbar, qui reste générique, aucune idée de quoi
 * chercher) : scopée par rôle (voir lib/globalSearch.ts), débattue avant
 * de lancer une vraie recherche (SEARCH_DEBOUNCE_MS) pour ne pas relancer
 * une recherche à chaque frappe.
 *
 * ReportProblemButton (via Topbar.extraActions) — "Signaler un problème",
 * disponible pour les 3 rôles normaux, à côté d'Aide : l'espace Admin
 * consomme/gère ces signalements (voir app/admin), mais ne les soumet
 * jamais lui-même.
 */
export default function AppShell({ role, user, notifications, organizationId, children }: AppShellProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isNotificationsOpen, setNotificationsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

    const hideTopbar = (HIDDEN_TOPBAR_PREFIXES[role] ?? []).some((prefix) => pathname.startsWith(prefix))
    const unreadCount = getUnreadCount(notifications)

    /**
     * Ferme la session de l'utilisateur et le ramene au formulaire de connexion.
     *
     * Passe par une Server Action et non par une navigation client : le cookie
     * de session est HttpOnly, donc invisible et ineffacable depuis le
     * navigateur. Seul le serveur peut le revoquer, aupres de l'API puis sur
     * le domaine du front.
     */
    async function handleLogout() {
        await seDeconnecter()
    }

    function handleHelpClick() {
        router.push(routes.public.support)
    }

    function handleSearch(query: string) {
        setSearchQuery(query)
        if (debounceTimer) clearTimeout(debounceTimer)

        if (!query.trim()) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        const timer = setTimeout(async () => {
            let results: SearchResult[] = []
            if (role === "formateur" && organizationId) {
                results = await searchFormateur(query, user.id, organizationId)
            } else if (role === "gestionnaire" && organizationId) {
                results = await searchGestionnaire(query, organizationId)
            } else if (role === "apprenant") {
                results = await searchApprenant(query, user.id)
            }
            setSearchResults(results)
            setIsSearching(false)
        }, SEARCH_DEBOUNCE_MS)
        setDebounceTimer(timer)
    }

    function handleSelectResult() {
        setSearchQuery("")
        setSearchResults([])
    }

    return (
        <div className={styles.shell}>
            <div className={styles.main}>
                <div className={styles.nav}>
                    <Sidebar items={NAVIGATION[role]} homeHref={ROLE_HOME_PATH[role]} onLogout={handleLogout} />

                    {!hideTopbar && (
                        <Topbar
                            user={{
                                firstName: user.firstName,
                                lastName: user.lastName,
                                name: getFullName(user),
                                role: ROLE_LABELS[role],
                                avatarUrl: user.avatarUrl,
                            }}
                            accountHref={ACCOUNT_ROUTE_BY_ROLE[role]}
                            notificationCount={unreadCount}
                            onSearch={handleSearch}
                            onHelpClick={handleHelpClick}
                            searchResults={
                                <GlobalSearchResults
                                    query={searchQuery}
                                    results={searchResults}
                                    isLoading={isSearching}
                                    onSelect={handleSelectResult}
                                />
                            }
                            onNotificationsClick={() => setNotificationsOpen(true)}
                            spaceSwitcher={<SpaceSwitcher currentRole={role} availableRoles={user.roles} />}
                            extraActions={
                                <ReportProblemButton
                                    userId={user.id}
                                    userName={getFullName(user)}
                                    role={role}
                                    organizationId={organizationId}
                                />
                            }
                        />
                    )}
                </div>

                <main className={styles.content}>{children}</main>

                <MiniFooter variant="horizontal" />
            </div>

            <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
            />
        </div>
    )
}