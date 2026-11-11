import { getCurrentSession, getUserById } from "@/_mocks/users.mock";
import { getAssignmentsForOrganization } from "@/_mocks/assignments.mock";
import { getContentModules } from "@/_mocks/contentModules.mock";
import {
  getOrgPublishedVersions,
  getModuleVersionById,
} from "@/_mocks/moduleVersions.mock";
import { getGroupsForOrganization } from "@/_mocks/groups.mock";
import { getApprenantSummariesForOrganization } from "@/_mocks/apprenantSummaries.mock";
import { getOverriddenGroupAssignment } from "@/lib/assignedModules";
import { findModuleForNiveau } from "@/_mocks/assignments.mock";
import { getFullName } from "@/lib/user";
import AssignationsView, {
  type AssignationRow,
  type AssignableModule,
} from "@/components/shared/AssignationsView";

/**
 * Vue org entière, mêmes composants que côté formateur
 * (components/shared/assignations), ni AssignationsView ni
 * NewAssignationModal n'avaient de dépendance spécifique au formateur,
 * seule la source de données change ici (org entière, pas juste ce que
 * CE formateur a lui-même créé, voir getAssignmentsForOrganization).
 */
export default async function GestionnaireAssignationsPage() {
  const { user, gestionnaireProfile } = await getCurrentSession();
  const organizationId = gestionnaireProfile?.organizationId ?? "";

  const [assignments, modules, publishedVersions, groups, apprenantSummaries] =
    await Promise.all([
      getAssignmentsForOrganization(organizationId),
      getContentModules(organizationId),
      getOrgPublishedVersions(organizationId),
      getGroupsForOrganization(organizationId),
      getApprenantSummariesForOrganization(organizationId),
    ]);

  const assignableModules: AssignableModule[] = modules
    .map((module) => {
      const versions = publishedVersions
        .filter((v) => v.moduleId === module.id)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      if (versions.length === 0) return null;
      return {
        moduleId: module.id,
        title:
          versions[versions.length - 1].content.title || "Module sans titre",
        officialVersionId: module.officialVersionId,
        versions: versions.map((v, index) => ({
          versionId: v.id,
          versionNumber: index + 1,
          title: v.content.title || "Sans titre",
          isOfficial: v.id === module.officialVersionId,
          createdAt: v.createdAt,
          niveaux: v.content.niveaux.map((n) => ({ id: n.id, title: n.title })),
        })),
      };
    })
    .filter((m): m is AssignableModule => m !== null);

  /** Même logique que côté formateur — numéro de version pour le libellé "Version spécifique (v2)". */
  function findVersionNumber(
    moduleId: string,
    versionId: string,
  ): number | undefined {
    const versions = publishedVersions
      .filter((v) => v.moduleId === moduleId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    const index = versions.findIndex((v) => v.id === versionId);
    return index === -1 ? undefined : index + 1;
  }

  const apprenantOptions = Array.from(
    new Map(
      apprenantSummaries.map((s) => [
        s.userId,
        { userId: s.userId, fullName: s.fullName },
      ]),
    ).values(),
  );

  const rows: AssignationRow[] = await Promise.all(
    assignments.map(async (assignment) => {
      const niveauLocation =
        assignment.targetType === "niveau"
          ? await findModuleForNiveau(assignment.targetId, assignment.versionId)
          : undefined;
      const resolvedModuleId =
        (assignment.targetType === "module"
          ? assignment.targetId
          : niveauLocation?.moduleId) ?? "";

      const module = modules.find((m) => m.id === resolvedModuleId);
      const resolvedVersionId =
        assignment.versionId ??
        niveauLocation?.versionId ??
        module?.officialVersionId;
      const version = resolvedVersionId
        ? await getModuleVersionById(resolvedVersionId)
        : undefined;
      const { assignedTo } = assignment;
      const targetLabel =
        assignedTo.type === "group"
          ? (groups.find((g) => g.id === assignedTo.groupId)?.name ??
            "Groupe supprimé")
          : (apprenantSummaries.find((s) => s.userId === assignedTo.userId)
              ?.fullName ?? "Apprenant introuvable");

      const overriddenGroup =
        assignedTo.type === "apprenant" && resolvedModuleId
          ? await getOverriddenGroupAssignment(
              resolvedModuleId,
              assignedTo.userId,
            )
          : null;

      const assigner = await getUserById(assignment.assignedByUserId);

      const isOfficial = version && version.id === module?.officialVersionId;
      const versionNumber =
        version && resolvedModuleId
          ? findVersionNumber(resolvedModuleId, version.id)
          : undefined;
      const versionLabel = assignment.versionId
        ? version
          ? isOfficial
            ? "Officielle"
            : `Version spécifique${versionNumber ? ` (v${versionNumber})` : ""}`
          : "Version introuvable"
        : "Officielle (courante)";

      return {
        id: assignment.id,
        moduleId: resolvedModuleId,
        moduleTitle:
          version?.content.title ??
          (module ? "Aucune version officielle" : "Module introuvable"),
        activityTitle:
          assignment.targetType === "niveau"
            ? (niveauLocation?.niveauTitle ?? "Activité introuvable")
            : undefined,
        versionLabel,
        targetId:
          assignedTo.type === "group" ? assignedTo.groupId : assignedTo.userId,
        targetLabel,
        targetType: assignedTo.type,
        dueDate: assignment.dueDate,
        assignedAt: assignment.assignedAt,
        overriddenGroupName: overriddenGroup?.groupName,
        assignedByName: assigner ? getFullName(assigner) : undefined,
      };
    }),
  );

  return (
    <AssignationsView
      rows={rows}
      assignableModules={assignableModules}
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      apprenants={apprenantOptions}
      userId={user.id}
      role="gestionnaire"
    />
  );
}