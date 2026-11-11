import type { Group } from "@/types/group"
import type { Role } from "@/constants/roles"

/**
 * Une ligne de l'aperçu des groupes. Même forme que ce qu'attend
 * StaffGroupListItem : la page passe ces objets tels quels, et le compilateur
 * vérifie l'accord au point d'appel.
 */
export interface LigneGroupeTableauBord {
	group: Group
	memberCount: number
	pendingInvitationCount: number
	averageProgress: number
	/** Modules en retard, cumulés sur les apprenants du groupe */
	lateCount: number
}

/** Module officialisé que personne ne suit. */
export interface ModuleNonAssigne {
	moduleId: string
	title: string
}

/** Groupe qui a des membres mais 0 % de progression moyenne. */
export interface GroupeStagnant {
	groupId: string
	name: string
	memberCount: number
}

/** Module officialisé dont l'auteur n'a plus de compte actif. */
export interface ContenuOrphelin {
	moduleId: string
	title: string
	creatorName: string
}

/**
 * Ce que rend `GET /api/gestionnaire/accueil` : l'écran d'accueil du
 * gestionnaire en une seule réponse.
 *
 * Chaque champ correspond à un élément affiché, et à rien d'autre. Les règles
 * qui les produisent (moyenne par personne et non par adhésion, groupe
 * stagnant, couverture d'une version officielle, compte d'auteur désactivé)
 * sont appliquées par le serveur : un autre client affiche les mêmes chiffres
 * sans rien recalculer.
 *
 * `groupes` porte TOUTES les lignes de l'organisation ; combien en montrer
 * dans l'aperçu est une décision de mise en page, prise par la page.
 */
export interface TableauBordGestionnaire {
	nombreModulesAReviser: number
	nombreGroupes: number
	nombreMembres: number
	progressionMoyennePourcent: number
	nombreInvitationsEnAttente: number
	groupes: LigneGroupeTableauBord[]
	groupesStagnants: GroupeStagnant[]
	modulesNonAssignes: ModuleNonAssigne[]
	contenuOrphelin: ContenuOrphelin[]
	repartitionRoles: Record<Role, number>
}