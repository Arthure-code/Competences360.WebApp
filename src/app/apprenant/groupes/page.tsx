import { getMyGroups } from "@/_mocks/groups.mock"
import { getOrganizationById } from "@/_mocks/organizations.mock"
import { lireSession } from "@/_mocks/users.mock"
import { getAssignedModulesForGroup } from "@/lib/assignedModules"
import { routes } from "@/constants/routes"
import { redirect } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import GroupListItem from "@/components/groupes/GroupListItem"
import GroupDetailView from "@/app/apprenant/_components/groupes/GroupDetailView"
import GroupsEmptyState from "@/app/apprenant/_components/groupes/GroupsEmptyState"
import JoinGroupButton from "@/app/apprenant/_components/groupes/JoinGroupButton"
import styles from "./page.module.css"

interface ApprenantGroupesPageProps {
    searchParams: Promise<{ code?: string }>
}

/**
 * N'utilise plus getAllModules/getModulesByIds (ancien catalogue statique,
 * group.moduleIds était un reliquat) — getAssignedModulesForGroup
 * (lib/assignedModules.ts) résout depuis les vraies assignations.
 */
export default async function ApprenantGroupesPage({ searchParams }: ApprenantGroupesPageProps) {
    const { code } = await searchParams
    const session = await lireSession()

    // Le QR d'un groupe mène ici, et il est scanné le plus souvent par
    // quelqu'un qui n'est pas connecté sur ce téléphone. Sans `?apres=`, le
    // code disparaîtrait à la connexion et personne ne rejoindrait rien.
    if (session === null) {
        const cible = code
            ? `${routes.apprenant.groupes.root}?code=${encodeURIComponent(code)}`
            : routes.apprenant.groupes.root

        redirect(`${routes.auth.login}?apres=${encodeURIComponent(cible)}`)
    }

    const { user } = session
    const groups = await getMyGroups(user.id)

    if (groups.length === 0) {
        return (
            <div className={styles.page}>
                <PageHeader title="Mes groupes" subtitle="Vous ne faites partie d'aucun groupe" />
                <GroupsEmptyState initialCode={code} />
            </div>
        )
    }

    if (groups.length === 1) {
        const group = groups[0]
        const organization = await getOrganizationById(group.organizationId)
        return (
            <div className={styles.page}>
                <div className={styles.singleGroupActions}>
                    <JoinGroupButton initialCode={code} />
                </div>
                <GroupDetailView group={group} organizationName={organization?.name ?? ""} userId={user.id} />
            </div>
        )
    }

    const rows = await Promise.all(
        groups.map(async (group) => {
            const organization = await getOrganizationById(group.organizationId)
            const groupModuleResults = await getAssignedModulesForGroup(group.id)
            const lateCount = groupModuleResults.filter(({ module }) => module.status === "late").length
            return { group, organizationName: organization?.name ?? "", totalModuleCount: groupModuleResults.length, lateCount }
        }),
    )
    const totalLate = rows.reduce((sum, row) => sum + row.lateCount, 0)

    return (
        <div className={styles.page}>
            <PageHeader
                title="Mes groupes"
                subtitle={`${groups.length} groupes actifs${
                    totalLate > 0 ? ` · ${totalLate} module${totalLate > 1 ? "s" : ""} en retard` : ""
                }`}
                actions={<JoinGroupButton initialCode={code} />}
            />
            <div className={styles.list}>
                {rows.map(({ group, organizationName, totalModuleCount, lateCount }) => (
                    <GroupListItem
                        key={group.id}
                        group={group}
                        organizationName={organizationName}
                        totalModuleCount={totalModuleCount}
                        lateModuleCount={lateCount}
                    />
                ))}
            </div>
        </div>
    )
}