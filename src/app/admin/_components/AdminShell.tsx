"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { faHouse, faUserShield, faUser, faBuilding, faGear, faFlag, faClockRotateLeft, faUsers, faSliders, faFileLines, faChartLine } from "@fortawesome/free-solid-svg-icons"
import Sidebar, { type SidebarItem } from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { logoutAdmin } from "@/_mocksAdmin/adminAuth.actions"
import { searchAdmin, type AdminSearchResult } from "@/_mocksToMigrate/adminSearch.mock"
import AdminSearchResults from "@/app/admin/_components/AdminSearchResults"
import { AdminSearchProvider } from "@/app/admin/_components/AdminSearchContext"
import { routes } from "@/constants/routes"
import { getAdminFullName } from "@/lib/adminUser"
import type { AdminUser } from "@/types/adminUser"
import styles from "./AdminShell.module.css"

interface AdminShellProps {
    admin: AdminUser
    children: React.ReactNode
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Recherche — même esprit que AppShell.tsx (debounce avant de lancer la
 * vraie recherche), mais résultats affichés avec highlightMatches (voir
 * AdminSearchResults.tsx), pas GlobalSearchResults (jamais vu dans cette
 * session, composant réel que je ne veux pas deviner).
 */
export default function AdminShell({ admin, children }: AdminShellProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
    // Séparé de searchQuery — le clic extérieur ferme juste le menu (ne
    // réinitialise rien), contrairement à la croix d'effacement
    // (comportement normal de SearchInput). searchQuery continue
    // d'alimenter le filtre en place des pages (AdminSearchContext) même
    // menu fermé — seule la croix remet tout à zéro.
    const [isDropdownVisible, setDropdownVisible] = useState(false)
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setDropdownVisible(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const items: SidebarItem[] = [
        { label: "Accueil", href: routes.admin.home, icon: faHouse },
        { label: "Contenu", href: routes.admin.contenu.root, icon: faFileLines },
        { label: "Statistiques", href: routes.admin.statistiques, icon: faChartLine },
        { label: "Organisations", href: routes.admin.organisations.root, icon: faBuilding },
        { label: "Utilisateurs", href: routes.admin.utilisateurs.root, icon: faUsers },
        { label: "Administrateurs", href: routes.admin.administrateurs, icon: faUserShield },
        { label: "Signalements", href: routes.admin.signalements.root, icon: faFlag },
        { label: "Journal d'audit", href: routes.admin.journalAudit, icon: faClockRotateLeft },
        { label: "Réglages", href: routes.admin.reglages, icon: faSliders },
        { label: "Mes paramètres", href: routes.admin.parametres, icon: faGear },
        { label: "Mon compte", href: routes.admin.compte, icon: faUser },
    ]

    async function handleLogout() {
        await logoutAdmin()
        router.push(routes.admin.login)
        router.refresh()
    }

    function handleSearch(query: string) {
        setSearchQuery(query)
        setDropdownVisible(true)
        if (debounceTimer) clearTimeout(debounceTimer)

        if (!query.trim()) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        const timer = setTimeout(async () => {
            const results = await searchAdmin(query)
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
                <div className={styles.nav} ref={navRef}>
                    <Sidebar items={items} homeHref={routes.admin.home} onLogout={handleLogout} hideLogo />

                    <span className={styles.adminZoneBadge}>ZONE ADMIN</span>

                    <Topbar
                        user={{
                            firstName: admin.preferredFirstName || admin.firstName,
                            lastName: admin.lastName,
                            name: getAdminFullName(admin),
                            role: "Administrateur",
                            avatarUrl: undefined,
                        }}
                        accountHref={routes.admin.home}
                        searchPlaceholder="Rechercher une organisation, un administrateur, un utilisateur..."
                        onSearch={handleSearch}
                        searchResults={
                            isDropdownVisible && (
                                <AdminSearchResults
                                    query={searchQuery}
                                    results={searchResults}
                                    isLoading={isSearching}
                                    onSelect={handleSelectResult}
                                />
                            )
                        }
                    />
                </div>

                <main className={styles.content}>
                    <AdminSearchProvider value={searchQuery}>{children}</AdminSearchProvider>
                </main>
            </div>
        </div>
    )
}