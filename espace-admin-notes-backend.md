# Espace Admin — notes pour le backend

## 1. Comment l'espace Admin fonctionne

L'espace Admin (`/admin/...`) est un **rôle complètement séparé** du système normal (apprenant/formateur/gestionnaire) :

- **Authentification distincte** — pas de compte dans ta base de données. Un mécanisme séparé, avec ses propres comptes (nom, courriel, mot de passe), vit dans `_mocksAdmin/adminAuth.mock.ts` et `.actions.ts`. Un cookie de session différent (`admin-session`), jamais mélangé avec le cookie normal.
- **3 paliers de droits** :
  - **Administrateur** — accès de base
  - **Propriétaire** — peut créer/gérer d'autres comptes admin
  - **Racine** (inspiré du compte root AWS) — protection ultime, ne peut être désactivé/rétrogradé que par lui-même ou un autre compte racine. Seul un compte racine peut modifier les Réglages (section 6).
- **Aucun impact sur ton code** — ce système d'authentification est **entièrement autonome**, ne touche jamais à tes tables ni tes routes d'authentification normales.

## 2. Structure des dossiers de données (mocks)

Trois dossiers distincts, à ne jamais confondre :

| Dossier | Contenu | Qui y touche |
|---|---|---|
| `_mocks/` | **Tes fichiers réels**, branchés sur ton API | Toi, je n'y touche plus, sauf ajout d'une fonction qui **appelle vraiment ton API** |
| `_mocksAdmin/` | Authentification propre au rôle Admin uniquement | - |
| `_mocksToMigrate/` | **Fonctions qu'il te reste à construire** — voir section 3 | Moi pour l'instant, toi des que possible |

## 3. Le patron `_mocksToMigrate/` — comment le lire

Chaque fichier suit le même principe : **le code appelle déjà la vraie route que tu devras construire**, avec le nom et la forme qu'elle devrait logiquement avoir. Si cette route échoue (404), un repli local silencieux prend le relais — juste pour tester en attendant. **Rien à faire de ton côté** quand tu construis une route : le vrai appel se met à réussir tout seul. (mais vérifie que cela fonctionne au cas ou)

### Routes à construire, par fichier

**`organizations.mock.ts` / `.actions.ts`**
- `GET /api/organizations` — lister **toutes** les organisations (n'existe pas encore)
- Un champ `isActive` sur `Organization`
- Une route pour le modifier

**`organizationMembers.mock.ts` / `.actions.ts`**
- `PUT /api/utilisateurs/:userId/roles` — changer les rôles d'un membre
- `PUT /api/utilisateurs/:userId/organisation` — corriger l'organisation d'un membre

**`configuration.actions.ts`** 
- `PUT /api/configuration` — **la lecture existe déjà** (`GET /api/configuration`, `ConfigurationController`), mais aucune route d'écriture confirmée. 9 champs concernés : `joursCorbeilleContenu`, `joursAvantAnonymisationCompte`, `joursAvantPurgeAdhesion`, `maxVersionsParModule`, `seuilAvertissementVersions`, `seuilReussiteNiveauPourcent`, `joursInactivite`, `pointsExerciceReussi`, `pointsExercicePartiel`

**`userAccount.actions.ts`** *(nouveau)*
- `PUT /api/utilisateurs/:userId/statut` — activer/désactiver **un compte précis** (apprenant/formateur/gestionnaire), distinct de la désactivation d'un compte Admin. **Question ouverte** : `isActive: false` bloque-t-il vraiment la connexion pour un compte normal ? Faudrait juste avoir ce fonctionnement.

**`userSearch.mock.ts`** *(nouveau)*
- Actuellement, chercher un utilisateur fait **un appel par organisation** (pas de vraie route de recherche globale). À l'échelle (1000+ utilisateurs, 100+ orgs), ça devient coûteux.
- **Idéalement** : `GET /api/utilisateurs/recherche?q=...` — une vraie recherche côté serveur, à travers toutes les orgs d'un coup.

**Signalements** *(entièrement neuf, `reports.mock.ts` / `.actions.ts`)*
- Concept complètement nouveau — un utilisateur peut signaler un problème (bouton "Signaler un problème", visible dans toute l'app), un admin le consulte/y répond.
- Aucune route backend n'existe pour l'instant — tout vit en mémoire locale côté front (perdu à chaque redémarrage du serveur).
- Si ça doit persister pour de vrai : `POST /api/signalements`, `GET /api/signalements`, `PUT /api/signalements/:id/statut`, `POST /api/signalements/:id/messages`.

**Journal d'audit** *(entièrement neuf, `auditLog.mock.ts` / `.actions.ts`)*
- Trace les actions des admins (désactiver une org, changer un rôle, etc.) — actuellement en mémoire locale aussi, perdu au redémarrage.
- Si ça doit persister pour de vrai : `POST /api/journal-audit` (écriture interne, jamais appelée par un utilisateur normal), `GET /api/journal-audit`.

**Groupes** *(fonctions de lecture déjà réelles, mais un trou précis)*
- `GET /api/groups/:groupId/membres` — **manquant**. On a déjà "combien de membres", mais pas "qui sont-ils". Nécessaire pour un filtre "voir les utilisateurs d'un groupe précis" dans Admin.

**Contenu de base de la plateforme** *(creer des modeles)*

La page `/admin/contenu` existe et affiche le contenu de base, mais **rien ne peut être créé, modifié, ou mis à la corbeille** depuis l'espace Admin pour l'instant. Tout dépend de la même question de fond : est-ce qu'Admin peut agir sur du contenu sans organisation ?

- ✅ **Lecture — contournement fonctionnel en attendant** : `GET /api/contentmodules/forkable/:organizationId` traite déjà "pas d'organisation" comme la marque du contenu de plateforme. La page Admin appelle cette route **pour chaque organisation existante** et fusionne les résultats (union), pour ne jamais perdre un module de vue. Fonctionne, mais fait autant d'appels que d'organisations — grossit avec chaque nouvelle org.
  - **Mieux, si possible** : `GET /api/contentmodules/base` — retourne directement tout le contenu sans organisation, en un seul appel, sans avoir besoin de passer par un id d'org existant.

- ❌ **Créer un nouveau module de base — bloqué** : `POST /api/contentmodules/scratch` exige `organizationId` dans sa signature actuelle. Impossible pour Admin de créer quoi que ce soit tant que ce champ n'accepte pas d'être vide/absent.

- ❌ **Avoir "mes brouillons" en tant qu'Admin — bloqué, pour une raison différente** : `getMyDraftVersions` (et toute la mécanique de brouillon) vérifie l'identité du compte contre ton système `User` normal — un compte Admin n'y existe pas du tout. Même si la création sans organizationId devenait possible, la notion même de "brouillon appartenant à Admin" n'a actuellement aucune place dans le modèle de données : `createdByUserId` sur une version suppose un vrai `User`.
  - **Question à trancher ensemble** : est-ce qu'un `ContentModule`/`ModuleVersion` devrait pouvoir être rattaché à un id Admin (pas un `User`), ou est-ce qu'Admin devrait avoir son propre système de "contenu en préparation" séparé du système de brouillons normal ? Pas tranché de mon côté, à voir avec toi.

- ❌ **Modifier un module de base existant — jamais essayé, probablement bloqué pour la même raison** : aucune page `/admin/contenu/[moduleId]` n'existe encore côté Admin (l'éditeur réel, `EditorView`/`ContentEditor`, est conçu pour `role: "formateur" | "gestionnaire"` uniquement). Même une fois la création débloquée, éditer exigerait soit d'étendre ces composants à un 3e rôle, soit un éditeur Admin séparé.

- ❌ **Corbeille de contenu de base — bloquée** : `GET /api/contentmodules/organisation/:organizationId/corbeille` filtre par org, et le contenu sans org n'apparaît dans la corbeille d'aucune organisation. Même famille de problème que la lecture/création — une route `GET /api/contentmodules/base/corbeille` réglerait ça aussi, le jour où le reste est débloqué.

**En résumé, une seule vraie question couvre tout ça** : *comment un compte Admin (qui n'est ni une organisation, ni un `User`) peut-il créer/modifier/supprimer du contenu qui n'appartient à personne ?*

**Ma proposition** : `organizationId` vraiment optionnel sur `POST /api/contentmodules/scratch` (et les autres routes d'écriture concernées), plutôt qu'une organisation fictive pour Admin. Pas juste une préférence — c'est cohérent avec ce qui existe **déjà** dans tes données : le commentaire de `platformTemplates.mock.ts` confirme que le contenu de base existe déjà sans organisation réelle en lecture (`forkable/:organizationId` traite l'absence d'org comme la marque du contenu de plateforme). Une org fictive pour Admin créerait une entité à filtrer partout (listes d'orgs, Statistiques, Organisations) pour toujours, et contredirait cette décision que j'avais déjà prise.

## 4. Champs manquants sur tes types existants

Identifiés en essayant de construire une vraie page "profil utilisateur" complète pour Admin — actuellement **aucun** de ces champs n'existe, donc rien n'est affiché plutôt que d'inventer des données :

| Champ souhaité | Sur quel type | Statut |
|---|---|---|
| Date d'adhésion ("membre depuis le...") | `OrganizationMember` | N'existe pas du tout |
| Dernière connexion / activité générale | `OrganizationMember` | N'existe pas (différent de la progression d'apprentissage, qui elle existe déjà pour un apprenant) |
| Photo/avatar | `OrganizationMember` | N'existe pas sur ce type précis — peut-être disponible ailleurs (`getUserById`?), pas confirmé |
| Historique d'actions pour un formateur/gestionnaire ("a publié X le...", "a créé le groupe Y le...") | — | N'existe nulle part, aucun équivalent à ce qui existe déjà pour un apprenant (tentatives, moments forts) |

Je n'ai **pas** inventé ces champs dans l'interface — je préfère te les signaler maintenant plutôt que d'attendre, pour que tu puisses les construire en même temps que le reste si tu le juges utile.

## 5. Mon blocage précédent — résolu temporairement

Tu m'as donné 2 vrais ids (`5` — Boulangerie du Faubourg, `1` — La Griffe d'Alpha - Test). Ces deux orgs retournent bien leurs vraies données, mais elles sont vides en ce moment (probablement en cours de modification de ton côté) — un repli local illustratif prend le relais automatiquement en attendant, voir `organizationMembersFallback.seed.ts`. 

## 6. Pages déjà construites

- ✅ Authentification Admin
- ✅ Organisations (liste, détail, membres en 2 onglets Personnel/Apprenants, catégories, groupes)
- ✅ Accueil
- ✅ Réglages (réservé aux comptes racine)
- ✅ Signalements (consultation/gestion) + formulaire public "Signaler un problème"
- ✅ Journal d'audit
- ✅ Utilisateurs (recherche à travers les orgs, filtres org/rôle, classement A-Z, dossier unifié apprenant/staff, gestion des rôles et des groupes)
- ✅ Détail d'un groupe (lecture seule)


## 7. Pages restantes

- Statistiques plateforme — commencé, en chantier
- Contenu de base de la plateforme — bloqué sur la question `organizationId
- Accueil — à terminer