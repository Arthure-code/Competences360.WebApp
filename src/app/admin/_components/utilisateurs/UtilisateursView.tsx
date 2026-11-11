"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/ui/StatusBadge"
import { searchUsersAcrossOrgs, getUsersForOrganization, type UserSearchResult } from "@/_mocksToMigrate/userSearch.mock"
import { ROLE_LABELS, type Role } from "@/constants/roles"
import { routes } from "@/constants/routes"
import type { Organization } from "@/types/organization"
import styles from "./UtilisateursView.module.css"

const SEARCH_DEBOUNCE_MS = 300
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const ALL_ROLES: Role[] = ["apprenant", "formateur", "gestionnaire"]

interface UtilisateursViewProps {
    organizations: Organization[]
}

interface AlphaGroup {
    letter: string
    users: UserSearchResult[]
}

/** Groupe les résultats déjà trouvés par première lettre du nom — même esprit que Contacts (iPhone), appliqué aux résultats déjà filtrés (recherche + org + rôle). */
function groupByLetter(users: UserSearchResult[]): AlphaGroup[] {
    const sorted = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName))
    const groups: AlphaGroup[] = []

    for (const user of sorted) {
        const letter = user.fullName.charAt(0).toUpperCase()
        const existing = groups.find((g) => g.letter === letter)
        if (existing) {
            existing.users.push(user)
        } else {
            groups.push({ letter, users: [user] })
        }
    }

    return groups
}

/**
 * Recherche d'abord, jamais "tout afficher" — à 1000 utilisateurs/100
 * orgs, charger tout le monde au chargement de la page casserait (voir
 * userSearch.mock.ts).
 *
 * Filtres org/rôle — appliqués aux résultats déjà trouvés par la
 * recherche texte, pas une recherche séparée. Pré-remplis depuis l'URL
 * (?org=..., ?role=...) — sert le lien utilitaire depuis le détail d'org
 * ("voir dans Utilisateurs, déjà filtré par cette org").
 *
 * ⚠️ Pas de filtre par GROUPE pour l'instant — aucune fonction confirmée
 * pour "lister les membres d'un groupe précis" (getGroupsForOrganization
 * liste les groupes, pas qui en fait partie) — à vérifier/construire
 * avant d'ajouter ce filtre.
 */
export default function UtilisateursView({ organizations }: UtilisateursViewProps) {
    const searchParams = useSearchParams()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
    const [orgFilter, setOrgFilter] = useState<string>(() => searchParams.get("org") ?? "all")
    const [roleFilter, setRoleFilter] = useState<string>(() => searchParams.get("role") ?? "all")
    const [viaOrgLink, setViaOrgLink] = useState(false)

    // Charge directement tous les membres d'UNE org précise — sûr, déjà
    // borné (contrairement à "tout le monde"). Réutilisé au montage (lien
    // utilitaire ?org=X) ET quand on choisit un org dans le filtre
    // directement, sans avoir à taper de texte en plus.
    function loadOrgMembers(orgId: string) {
        const org = organizations.find((o) => o.id === orgId)
        if (!org) return
        setIsSearching(true)
        void getUsersForOrganization(org.id, org.name).then((found) => {
            setResults(found)
            setIsSearching(false)
        })
        setViaOrgLink(true)
    }

    function handleOrgFilterChange(value: string) {
        setOrgFilter(value)
        if (query.trim()) return // une recherche texte est déjà en cours, le filtre s'applique dessus, pas besoin de recharger
        if (value === "all") {
            setResults([])
            setViaOrgLink(false)
        } else {
            loadOrgMembers(value)
        }
    }

    useEffect(() => {
        const initialOrg = searchParams.get("org")
        const initialQuery = searchParams.get("q")

        if (initialOrg) {
            loadOrgMembers(initialOrg)
        } else if (initialQuery) {
            handleSearch(initialQuery)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredResults = useMemo(() => {
        return results.filter((user) => {
            const matchesOrg = orgFilter === "all" || user.organizationId === orgFilter
            const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter as Role)
            return matchesOrg && matchesRole
        })
    }, [results, orgFilter, roleFilter])

    const groups = useMemo(() => groupByLetter(filteredResults), [filteredResults])

    function handleSearch(value: string) {
        setQuery(value)
        setViaOrgLink(false)
        if (debounceTimer) clearTimeout(debounceTimer)

        if (!value.trim()) {
            setResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        const timer = setTimeout(async () => {
            const found = await searchUsersAcrossOrgs(value)
            setResults(found)
            setIsSearching(false)
        }, SEARCH_DEBOUNCE_MS)
        setDebounceTimer(timer)
    }

    return (
        <div className={styles.page}>
            <PageHeader title="Utilisateurs" subtitle="Cherchez un utilisateur par nom ou courriel, à travers toutes les organisations." />

            <div className={styles.controlsRow}>
                <div className={styles.searchWrapper}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} aria-hidden="true" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Nom ou courriel..."
                        className={styles.search}
                    />
                </div>

                <select value={orgFilter} onChange={(e) => handleOrgFilterChange(e.target.value)} className={styles.filterSelect}>
                    <option value="all">Toutes les organisations</option>
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.name}
                        </option>
                    ))}
                </select>

                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={styles.filterSelect}>
                    <option value="all">Tous les rôles</option>
                    {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                        </option>
                    ))}
                </select>
            </div>

            {viaOrgLink && (
                <p className={styles.hint}>
                    Tous les membres de {organizations.find((o) => o.id === orgFilter)?.name ?? "cette organisation"}.
                </p>
            )}

            {!query.trim() && !viaOrgLink ? (
                <p className={styles.hint}>Commencez à taper pour chercher un utilisateur.</p>
            ) : isSearching ? (
                <p className={styles.hint}>Recherche...</p>
            ) : filteredResults.length === 0 ? (
                <p className={styles.hint}>Aucun résultat pour « {query} » avec ces filtres.</p>
            ) : (
                <div className={styles.resultsWrapper}>
                    <div className={styles.groupedList}>
                        {groups.map((group) => (
                            <div key={group.letter} id={`letter-${group.letter}`} className={styles.group}>
                                <span className={styles.groupLetter}>{group.letter}</span>
                                <div className={styles.list}>
                                    {group.users.map((user) => (
                                        <Card
                                            key={user.id}
                                            href={routes.admin.utilisateurs.bySlug(user.id)}
                                            interactive
                                            padding="md"
                                            className={`${styles.row} ${!user.isActive ? styles.rowInactive : ""}`}
                                        >
                                            <div className={styles.rowInfo}>
                                                <span className={styles.rowName}>{user.fullName}</span>
                                                <span className={styles.rowEmail}>{user.email}</span>
                                                <span className={styles.rowMeta}>
                                                    {user.organizationName} — {user.roles.map((r) => ROLE_LABELS[r]).join(" + ")}
                                                </span>
                                            </div>
                                            <StatusBadge
                                                variant={user.isActive ? "success" : "neutral"}
                                                label={user.isActive ? "Actif" : "Désactivé"}
                                            />
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <nav className={styles.alphaRail} aria-label="Aller à la lettre">
                        {ALPHABET.map((letter) => {
                            const hasGroup = groups.some((g) => g.letter === letter)
                            return hasGroup ? (
                                <a key={letter} href={`#letter-${letter}`} className={styles.alphaRailLetter}>
                                    {letter}
                                </a>
                            ) : (
                                <span key={letter} className={`${styles.alphaRailLetter} ${styles.alphaRailLetterDisabled}`}>
                                    {letter}
                                </span>
                            )
                        })}
                    </nav>
                </div>
            )}
        </div>
    )
}