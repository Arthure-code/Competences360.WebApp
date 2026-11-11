import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllOrganizations } from "@/_mocksToMigrate/organizations.mock"
import { getOrganizationMembers } from "@/_mocks/organizationMembers.mock"
import { routes } from "@/constants/routes"

/**
 * ⚠️ TEMPORAIRE — PAGE DE DIAGNOSTIC, à retirer une fois le bug de
 * recherche résolu. Affiche directement ce que getOrganizationMembers
 * (le vrai, backend) retourne pour CHAQUE org du seed
 * (_mocksToMigrate/organizations.mock.ts) — permet de voir en un coup
 * d'œil si le problème vient : (a) du seed d'orgs (mauvais ids), (b) du
 * backend qui ne retourne rien pour ces ids, ou (c) autre chose.
 *
 * Pas de lien dans la nav — accessible seulement en tapant l'URL
 * directement : /admin/utilisateurs/debug
 */
export default async function UtilisateursDebugPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const organizations = await getAllOrganizations()

    const results = await Promise.all(
        organizations.map(async (org) => {
            let members: Awaited<ReturnType<typeof getOrganizationMembers>> = []
            let error: string | null = null
            try {
                members = await getOrganizationMembers(org.id)
            } catch (e) {
                error = e instanceof Error ? e.message : String(e)
            }
            return { org, members, error }
        })
    )

    return (
        <div style={{ fontFamily: "monospace", fontSize: 13, display: "flex", flexDirection: "column", gap: 24 }}>
            <h1>Diagnostic — membres bruts par org du seed</h1>

            <div style={{ border: "2px solid #5b6bf5", padding: 12, borderRadius: 8 }}>
                <strong>getAllOrganizations() a retourné {organizations.length} organisation(s) :</strong>
                <ul>
                    {organizations.map((org) => (
                        <li key={org.id}>
                            id="{org.id}" — {org.name} — {org.isActive === false ? "inactive" : "active"}
                        </li>
                    ))}
                </ul>
                <p style={{ color: "#6b7280" }}>
                    ⚠️ Cette liste vient du seed local (_mocksToMigrate/organizations.mock.ts), PAS d'une vraie route
                    backend (GET /api/organizations n'existe pas encore). Si une org réelle manque ici, elle doit être
                    ajoutée manuellement au seed.
                </p>
            </div>

            {results.map(({ org, members, error }) => (
                <div key={org.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                    <strong>
                        Org id="{org.id}" — {org.name}
                    </strong>
                    {error ? (
                        <p style={{ color: "red" }}>Erreur : {error}</p>
                    ) : members.length === 0 ? (
                        <p style={{ color: "orange" }}>getOrganizationMembers("{org.id}") a retourné 0 membre.</p>
                    ) : (
                        <ul>
                            {members.map((m) => (
                                <li key={m.id}>
                                    {m.fullName} — {m.email} — {m.roles.join(", ")} — {m.isActive ? "actif" : "inactif"}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    )
}