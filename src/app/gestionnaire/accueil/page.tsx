import PageHeader from "@/components/ui/PageHeader"
import StatGrid from "@/components/ui/StatGrid"
import Button from "@/components/ui/Button"
import { getCurrentSession } from "@/_mocks/users.mock"
import { getTableauBordGestionnaire } from "@/_mocks/gestionnaireDashboard.mock"
import { routes } from "@/constants/routes"
import GroupsPreviewSection from "@/components/shared/accueil/GroupsPreviewSection"
import OrganizationHealthSection from "@/components/shared/accueil/OrganizationHealthSection"
import styles from "./page.module.css"

const GROUPS_PREVIEW_COUNT = 3

/**
 * Pas AttentionSection/LateAlertsNotice ici (gardés côté formateur) : le
 * niveau de détail par apprenant ne convient pas à un gestionnaire qui
 * supervise toute l'org. OrganizationHealthSection les remplace par 3
 * problèmes structurels actionnables + 1 vue d'ensemble, voir sa
 * documentation.
 *
 * Un seul appel : l'API compose l'écran entier (voir
 * getTableauBordGestionnaire). Les chiffres ne sont ni calculés ni assemblés
 * ici, pour qu'une autre application affiche exactement les mêmes.
 */
export default async function GestionnaireAccueilPage() {
	const { user } = await getCurrentSession()
	const tableauBord = await getTableauBordGestionnaire()

	const statsItems = [
		{ id: "review", label: "À réviser", value: tableauBord.nombreModulesAReviser, icon: "faChartLine" },
		{ id: "groups", label: "Groupes", value: tableauBord.nombreGroupes, icon: "faUserGroup" },
		{ id: "members", label: "Membres", value: tableauBord.nombreMembres, icon: "faUser" },
		{ id: "progress", label: "Progression moyenne", value: `${tableauBord.progressionMoyennePourcent}%`, icon: "faChartLine" },
	]

	return (
		<div className={styles.page}>
			<PageHeader
				title={`Bonjour, ${user.preferredFirstName ?? user.firstName}`}
				subtitle="Voici un aperçu de l'organisation."
				actions={
					<div className={styles.actionsRow}>
						{/* <Button label="Assigner un module" variant="outline" href={routes.gestionnaire.assignations} /> */}
						<Button label="+ Créer un groupe" href={routes.gestionnaire.groupes.create} />
					</div>
				}
			/>

			<StatGrid items={statsItems} columns={4} />

			{tableauBord.nombreModulesAReviser > 0 && (
				<div className={styles.reviewNotice}>
					<span>
						{tableauBord.nombreModulesAReviser} module{tableauBord.nombreModulesAReviser > 1 ? "s" : ""} en attente de
						révision.
					</span>
					<Button label="Voir la file" variant="ghost" size="sm" href={`${routes.gestionnaire.contenu.root}?onglet=pending`} />
				</div>
			)}

			{tableauBord.nombreInvitationsEnAttente > 0 && (
				<div className={styles.reviewNotice}>
					<span>
						{tableauBord.nombreInvitationsEnAttente} invitation{tableauBord.nombreInvitationsEnAttente > 1 ? "s" : ""} en attente de
						réponse.
					</span>
					<Button label="Voir les invitations" variant="ghost" size="sm" href={`${routes.gestionnaire.membres}?onglet=invitations`} />
				</div>
			)}

			<GroupsPreviewSection
				rows={tableauBord.groupes.slice(0, GROUPS_PREVIEW_COUNT)}
				totalGroupCount={tableauBord.nombreGroupes}
				role="gestionnaire"
			/>

			<OrganizationHealthSection
				unassignedModules={tableauBord.modulesNonAssignes}
				stagnantGroups={tableauBord.groupesStagnants}
				orphanedContent={tableauBord.contenuOrphelin}
				roleDistribution={tableauBord.repartitionRoles}
			/>
		</div>
	)
}