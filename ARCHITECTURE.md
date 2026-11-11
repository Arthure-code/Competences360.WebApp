# Compétences 360 — Guide d'architecture pour le backend

Ce document explique comment le frontend est structuré, comment les données sont
actuellement simulées, et comment brancher le backend sans réécrire le frontend.

---

## Principe central

Chaque entité (utilisateur, groupe, module, assignation, etc.) suit la même
convention à 2 fichiers :

- **`*.mock.ts`** — un tableau en mémoire + les **lectures** (fonctions `get...`)
- **`*.actions.ts`** — les **écritures** (Server Actions Next.js, `"use server"`)

Cette séparation existe pour une seule raison : **brancher le backend = remplacer
l'intérieur de ces fonctions par de vrais appels API, sans toucher à rien
d'autre.** Chaque fonction garde son nom, ses paramètres et son type de retour
— tous les composants qui l'appellent continuent de fonctionner sans
modification.

```ts
// Aujourd'hui
export async function getGroupBySlug(slug: string): Promise<Group | undefined> {
    return groupsMock.find((g) => g.slug === slug)
}

// Demain, même signature, contenu remplacé (comme tu me l'a montré dans tes fichiers en dehors)
export async function getGroupBySlug(slug: string): Promise<Group | undefined> {
    return fetch(`/api/groups/${slug}`).then((r) => r.json())
}
```

---

## Structure des dossiers

| Dossier | Contenu |
|---|---|
| `types/` | Les formes de données (interfaces TypeScript), la vraie source de vérité sur *quoi* stocker |
| `_mocks/` | Simulation actuelle de la base de données (voir ci-dessus) |
| `_mocks/seeds/` | Données de démonstration, séparées de l'infrastructure, voir plus bas |
| `lib/` | Logique pure (calculs, formatage, résolution), n'importe où, pas de duplication |
| `hooks/` | État React côté client (ex. hydratation depuis `localStorage`) |
| `constants/` | Données figées (rôles, routes, seuils) |

---

## Comment brancher le backend

1. Pour chaque entité, remplacer le tableau + les lectures dans `*.mock.ts`
   par de vrais appels API
2. Remplacer les mutations dans `*.actions.ts` de la même façon
3. Ne **rien** toucher dans `lib/`, `hooks/`, `components/`, `app/` — ils
   consomment déjà ces fonctions par leur signature, jamais par leur
   implémentation

`types/` reste la référence : si un type change côté backend, il change ici
en premier, et TypeScript signale tout ce qui doit s'ajuster ailleurs.

---

## Cas particulier — la progression de l'apprenant

C'est le seul endroit qui **ne suit pas** la convention mock/actions, et c'est
important que tu le sache avant de commencer. (la précision dont je t'ai parlé)

**La progression pendant un exercice vit dans `localStorage` du navigateur**
(`lib/progressStorage.ts`), pas dans un mock. C'est voulu : `localStorage`
permet un affichage instantané, sans aller-retour réseau à chaque réponse.

Le point de branchement est déjà prêt : l'interface `ProgressStorage`
(`load`/`save`/`clear`) est injectable dans le hook `useNiveauProgress`. Le
backend n'a qu'à écrire une nouvelle implémentation de ces 3 méthodes qui
appelle une vraie API, et la passer au hook, **aucun composant ne change**.

En parallèle, **`apprenantModuleProgress.mock.ts`** est la vraie contrepartie
serveur (résultats finaux, pas chaque frappe), déjà persistée via de vraies
Server Actions (`apprenantModuleProgress.actions.ts`). Cette partie suit bien
la convention normale.

---

## Seeds vs mocks

Chaque mock contenant des données de démonstration a son propre fichier
`_mocks/seeds/*.seed.ts` .L'infrastructure (`*.mock.ts`) reste minimale,
les données d'exemple sont ailleurs. Pour repartir d'un état vide (tester
"aucune donnée"), commenter la ligne `.push(...getXxxSeed())` dans le
`.mock.ts` correspondant.

---

## Outil de développement — sessions de test

`DevSessionSwitcher` (visible seulement en développement) permet de basculer
entre 4 comptes de test (apprenant, formateur, gestionnaire, les deux
cumulés) sans authentification réelle, un cookie lu par `getCurrentSession()`
(`users.mock.ts`). Une fois la vraie authentification branchée, cette
fonction est remplacée comme les autres ; le sélecteur disparaît
naturellement (il ne s'affiche que si `NODE_ENV === "development"`).
On peut également se rendre sur l'accueil du site avec 0.

---

## Zones encore en mouvement

Deux parties du projet ne sont pas encore stabilisées, volontairement :

- **`_mocks/platformTemplates.mock.ts`** (contenu de base de la plateforme,
  forkable par les organisations) — solution transitoire en attendant la
  conception du rôle **Administrateur de plateforme** (admin), pas encore commencée.
  Sera probablement remplacé une fois ce rôle défini.
- **`ApprenantSummary`** (résumé formateur d'un apprenant), encore son
  propre mock statique, pas dérivé du vrai suivi de progression. Se
  résoudra naturellement une fois de vraies données de progression
  existantes pour l'ensemble des apprenants de test, pas seulement un.

Le reste de la structure (types, lib, hooks, constants, la convention
mock/actions) est stable et ne sera plus remodifié en profondeur.