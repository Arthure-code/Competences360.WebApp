# Système de contenu — Modules, versions, CRUD

Document de référence pour l'équipe backend. Explique le modèle de données, le CRUD complet côté formateur, et ce qui change côté gestionnaire.

---

## 1. Deux entités, pas une

C'est le point le plus important à comprendre avant tout le reste.

- **`ContentModule`** = la carte qu'on voit dans la grille de contenu. Un seul par module, peu importe combien de fois il a été modifié.
- **`ModuleVersion`** = une itération de contenu pour ce module. Un module peut avoir plusieurs versions (son historique).

Un `ContentModule` porte un pointeur `officialVersionId` vers **la** version que les apprenants voient actuellement. Les autres versions existent, sont visibles par l'organisation, mais ne sont pas "en service".

```
ContentModule "Calculer un budget simple"
├── officialVersionId: "mv-3"  (ou null si rien n'est encore appliqué)
└── versions liées (par moduleId) :
    ├── mv-1 — draft
    ├── mv-2 — published
    └── mv-3 — published, et c'est celle-ci qui est officielle
```

### Pourquoi cette séparation

Parce que "modifier un module" et "ce que les apprenants voient" sont deux choses différentes. Un formateur peut retravailler son contenu librement (créer une nouvelle version, la publier) sans jamais affecter ce qui est en service — jusqu'à ce qu'un gestionnaire décide explicitement de l'appliquer.

---

## 2. Les statuts — seulement 2, jamais 3

```ts
type ModuleVersionStatus = "draft" | "published"
```

- **`draft`** — privé au créateur. Personne d'autre ne le voit, pas même dans l'onglet "Contenu des formateurs" du gestionnaire.
- **`published`** — visible par toute l'organisation, immédiatement, **sans approbation**. N'importe quel formateur peut le consulter, et même l'**assigner** à ses propres apprenants (`Assignment.versionId` cible une version précise, pas forcément l'officielle).

**"Officiel" n'est pas un 3ᵉ statut.** C'est un pointeur séparé (`ContentModule.officialVersionId`), pas un champ sur la version elle-même. Une version reste `published` qu'elle soit officielle ou non — seul le pointeur change.

### Pourquoi pas d'approbation à la publication

C'est un choix délibéré, basé sur comment fonctionnent les bons outils du domaine   : bloquer le partage entre collègues tue la collaboration. La friction humaine (le gestionnaire) n'intervient qu'au niveau "officiel", jamais avant.

---

## 3. Modèle de données

```ts
interface ContentModule {
    id: string
    organizationId: string
    officialVersionId: string | null
    officializedByUserId?: string   // rempli seulement si officialVersionId n'est pas null
    officializedAt?: string
    forkedFromGlobalModuleId?: string  // absent si créé de A à Z
}

interface ModuleVersion {
    id: string
    moduleId: string                // -> ContentModule.id, toujours requis
    previousVersionId?: string      // trace v1 -> v2 -> v3, absent sur la 1ère version d'un module
    organizationId: string
    status: "draft" | "published"
    changeNote?: string             // note optionnelle laissée par le créateur
    createdByUserId: string
    createdByName: string           // dénormalisé — reste lisible même si le compte est désactivé
    createdAt: string
    content: ModuleVersionContent
}

interface ModuleVersionContent {
    title: string
    description: string
    categoryId: string
    niveaux: NiveauDraft[]           // "Activité" à l'affichage, le nom interne reste "Niveau" (voir §7)
}
```

Le **résumé automatique** affiché dans l'historique ("2 activités ajoutées, 1 exercice modifié") n'est **pas stocké** — il est recalculé à chaque affichage en comparant `version.content` à `previousVersionId.content`. Aucun champ à synchroniser côté backend pour ça.

---

## 4. CRUD complet — fonctions attendues côté backend

Voici les fonctions actuellement mockées (`_mocks/contentModules.mock.ts` et `_mocks/moduleVersions.mock.ts`) — chacune devient un vrai appel API.

### Lecture

| Fonction | Retourne |
|---|---|
| `getContentModules(organizationId)` | Tous les modules d'une org |
| `getContentModuleById(moduleId)` | Un module |
| `getModuleVersionById(versionId)` | Une version |
| `getVersionsForModule(moduleId)` | Toutes les versions d'un module, plus récente en premier |
| `getVersionCountForModule(moduleId)` | Nombre de versions (pour la limite) |
| `getMyDraftVersions(userId)` | Brouillons d'un utilisateur, tous modules confondus |
| `getMyPublishedVersions(userId)` | Publications d'un utilisateur |
| `getOrgPublishedVersions(organizationId)` | Toutes les versions publiées de l'org, tous auteurs confondus |
| `getForkableModules(organizationId)` | Modules du catalogue global pas encore forkés par cette org |

### Écriture

| Fonction | Effet |
|---|---|
| `createModuleFromScratch(input)` | Crée un `ContentModule` **et** sa 1ère `ModuleVersion` (draft) d'un coup |
| `createModuleFromGlobal(input)` | Pareil, mais copie le contenu d'un module du catalogue global et fixe `forkedFromGlobalModuleId` |
| `createNewVersionInModule(input)` | Nouvelle version dans un module **existant**, copie le contenu d'une version source choisie. Retourne `undefined` si la limite (10, voir §5) est atteinte |
| `publishVersion(versionId)` | `draft` → `published`. Instantané, aucune validation requise |
| `applyOfficialVersion(moduleId, versionId, gestionnaireUserId)` | Déplace `officialVersionId`. **Doit être réservé au rôle gestionnaire côté backend** — rien dans les données elles-mêmes n'empêche un formateur de l'appeler, c'est une vérification de permission à faire au niveau API |
| `revertToDraft(versionId, gestionnaireUserId)` | `published` → `draft`. Si c'était la version officielle, `officialVersionId` repasse à `null`. **Réservé au gestionnaire** |
| `updateModuleVersionContent(versionId, content)` | Sauvegarde le contenu (auto-save, débattue ~1s après la dernière frappe côté client) |
| `deleteModuleVersion(versionId)` | Supprime une version. **Ne devrait être permis que pour un `draft`** appartenant à l'appelant |
| `deleteModuleVersions(versionIds)` | Suppression groupée, même règle |

### Règles de permission à valider côté backend (le front ne fait que les refléter visuellement)

- Modifier le contenu d'une version : seulement si `status === "draft"` **et** `createdByUserId === utilisateur courant`
- Supprimer une version : même règle, **et** `version.id !== module.officialVersionId`
- `applyOfficialVersion` / `revertToDraft` : rôle gestionnaire uniquement
- `publishVersion` : le créateur de la version, peu importe le rôle (formateur ou gestionnaire)

---

## 5. Règles métier à connaître

- **Limite de versions** : 10 par module. Avertissement affiché dès la 8ᵉ. `createNewVersionInModule` doit refuser au-delà (le mock retourne `undefined`, l'API devrait retourner une erreur explicite).
- **"Modifier" une version officielle ne l'édite jamais en place.** Ça déclenche un fork implicite — nouvelle version en brouillon, copie du contenu. La version en service ne change jamais sous les apprenants pendant qu'un formateur retravaille dessus.
- **Un compte désactivé n'efface rien.** Ses brouillons deviennent visibles au gestionnaire (requête élargie sur les brouillons "orphelins", pas de réassignation de `createdByUserId`). Son contenu publié/officiel reste intact, avec l'attribution affichant `createdByName` (dénormalisé) + un badge "Compte désactivé".
- **`Assignment.versionId`** cible une version précise, pas nécessairement l'officielle. Un formateur peut assigner à ses apprenants une version publiée par un collègue, ou sa propre version non officielle. C'est voulu — la publication sert justement à ça.

---

## 6. Page Contenu — formateur

Structure : grille de `ContentModule`, **une carte par module**, jamais par version. Filtrée par onglet :

| Onglet | Filtre |
|---|---|
| Mes brouillons | Modules où l'utilisateur a au moins 1 version `draft` |
| Mes publications | Modules où l'utilisateur a au moins 1 version `published` |
| Contenu de {org} | Modules où `officialVersionId` n'est pas `null` — lecture seule, aucune action de promotion |

Cliquer une carte → page module (2 onglets : **Résumé du contenu** en lecture seule, **Historique des versions** avec actions Modifier/Supprimer/Appliquer par ligne + sélection groupée  ).

L'éditeur lui-même (`ContentEditor`) affiche, par activité, un **panneau d'édition interactif** — les 6 types d'exercices "simples" s'éditent directement sur le rendu (cliquer un choix pour le renommer, une étoile pour marquer la bonne réponse). `zone_cliquable` permet de dessiner des zones au curseur/doigt sur une image importée. `video_interactive` ouvre un graphe (React Flow) : nœuds = segments vidéo, flèches = choix de parcours.

---

## 7. Ce qui est partagé avec gestionnaire (déjà prêt, aucun changement requis)

Le principe : **un seul jeu de composants, des permissions différentes** — jamais de code dupliqué par rôle.

- `ContentEditor` — accepte déjà `canPublishVersion`, `canApplyOfficial`, `canDelete`, `readOnly` en props. Le bouton "Appliquer au module" existe déjà dans le code, simplement jamais affiché (`canApplyOfficial={false}` côté formateur).
- `ActivityWorkspace` + les 8 `*EditablePreview` (un par type d'exercice) — identiques pour les deux rôles.
- `ModulePageView`, `VersionHistoryTab`, `ModuleSummaryTab`, `CreateVersionModal` — identiques.
- Tout le modèle de données et les fonctions CRUD du §4.

**Note technique** — le nom interne du type `Niveau`/`niveauId` reste inchangé dans le code (utilisé par des dizaines de fichiers déjà en place côté apprenant). Seul l'affichage dit "Activité" à l'écran, jamais "Niveau X :" en préfixe. Le backend n'a rien à faire ici — c'est une pure question de libellé front-end, la structure de données ne change pas.

---

## 8. Ce qui sera différent côté gestionnaire

| | Formateur | Gestionnaire |
|---|---|---|
| **Onglets grille** | Mes brouillons / Mes publications / Contenu de l'org (lecture seule) | Brouillons / Publications / **Contenu des formateurs** |
| **`canApplyOfficial`** | `false` | `true` |
| **Nouvel onglet "Contenu des formateurs"** | — | Toutes les versions `published` de l'org, tous formateurs confondus (`getOrgPublishedVersions`), avec actions **Promouvoir** et **Renvoyer en brouillon** |
| **Onglet Brouillons** | Les siens uniquement | Les siens **+ ceux des comptes désactivés** |
| **Page module** | Bouton "Appliquer" absent de l'historique | Bouton "Appliquer" actif sur les versions `published` non encore officielles |

Rien de nouveau à construire au niveau des données ou des permissions détaillées dans ce document — uniquement une nouvelle page (`app/gestionnaire/contenu/`) qui appelle les mêmes composants avec d'autres props, plus l'action "Renvoyer en brouillon" (déjà écrite : `revertToDraft`) à brancher quelque part dans l'UI, ce qui n'existe pas encore côté formateur (normal, ça ne le concerne pas).

---

## 9. Mocks disponibles pour tester

`_mocks/contentModules.mock.ts` et `_mocks/moduleVersions.mock.ts` contiennent 9 modules / 17 versions couvrant :
- Les 8 types d'exercices (au moins un exemple chacun)
- Un module à 8 versions (`cm-8`) pour tester l'avertissement de limite sans travail manuel
- Un module dont l'auteur est un compte désactivé (`cm-9`, `usr-sophie-gagnon`) pour tester l'attribution
- Une lignée à 2 générations (`cm-3` : `mv-3` officielle, `mv-5` qui l'améliore sans encore être appliquée)

**Ces mocks vivent en mémoire du serveur** — un redémarrage les remet à leur état de départ. Utile en dev, mais à remplacer entièrement une fois le backend branché (aucune fonction listée au §4 ne persiste réellement au-delà de la session actuelle).
