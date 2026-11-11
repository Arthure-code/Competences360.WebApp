# Espace Admin — à régler côté backend


## 1. LE PROBLÈME DE FOND — à régler en premier

Admin a son propre cookie (`.Competences360.Admin`), distinct de la session normale (`.Competences360.Auth`). Certaines routes n'acceptent que `.Competences360.Auth` et rejettent Admin avec `401`, même si le cookie Admin est valide et bien envoyé (confirmé en lisant `lib/api.ts`, le client envoie déjà le bon cookie).

**Confirmé cassé pour cette raison** :
- `POST /api/contentmodules/scratch` → `401`
- `GET /api/export` → `401`

**Demande** : élargir ces routes pour accepter aussi `.Competences360.Admin`, pas de nouvelle URL. D'autres routes non testées ont probablement le même problème.

**Question sur `organizationId`** : pour signaler "aucune organisation" (contenu de base), `null` ou `0` ? Les deux ont un risque (`null` peut échouer si le champ n'est pas nullable ; `0` peut un jour entrer en conflit avec une vraie org). Qu'est-ce que tu avais chosi?

## 2. Routes manquantes, cassées ou non trouvées (si tu les as fait, indique moi ou?)

| Route | Statut | Pour |
|---|---|---|
| `POST /api/contentmodules/scratch` | `401` Admin — élargir (section 1) | Créer du contenu de base |
| `GET /api/export` | `401` Admin — élargir (section 1) | Export stats |
| `GET /api/contentmodules/base` | N'existe pas | Lire contenu de base en 1 appel |
| `GET /api/contentmodules/base/corbeille` | N'existe pas | Corbeille du contenu de base |
| `GET /api/groups/:id/membres` | N'existe pas | Membres d'un groupe |
| `GET /api/utilisateurs/recherche?q=` | N'existe pas (contournement en place) | Recherche globale |
| `GET /api/statistiques/plateforme` | N'existe pas (contournement en place) | Stats toutes orgs |
| `PUT /api/utilisateurs/:id/statut` | Fonctionne — **confirme que isActive:false bloque vraiment la connexion** | Désactiver un compte |
| Route "mes brouillons" (`getMyDraftVersions`) | Testée : `400`, `errors:{id:[...]}` — existe probablement, mauvais format. **Quelle est l'URL/forme exacte ?** | Brouillons Admin |

## 3. Supervision de contenu (nouveau)

Admin voit (lecture seule) et retire le contenu de n'importe quelle org, avec raison obligatoire.

Étendre `moveModuleToTrash(moduleId, requestingUserId, isGestionnaireOfThisOrg, isAdminAction, reason)` :
- `isAdminAction: true` → contourne la vérification d'org
- `reason` obligatoire si `isAdminAction` est vrai, consultable (journal d'audit — consigné automatiquement, pas d'appel séparé nécessaire)

Les routes de sauvegarde/publication/application/suppression déjà existantes doivent aussi accepter `.Competences360.Admin` (même principe que section 1), y compris pour la lecture seule (preview).

## 4. À faire maintenant

1. **Régler les erreurs dans Contenu et autres ci-dessus**
2. **Brancher le stockage de médias acheté** (identifiants déjà envoyés)
3. **Mettre en ligne**
4. **Twilio**
5. **Setter les emails** (je t'envoie les identifiants bientot, c'est presque pret)
6. **Champs manquants**

## 5. Décision prise — brouillons Admin

`createdByUserId` accepte un id Admin directement (déjà dénormalisé, pas de raison de le restreindre à un `User`).

## 6. Champs manquants sur `OrganizationMember`

Date d'adhésion, dernière connexion/activité, photo/avatar — aucun n'existe. Historique d'actions (formateur/gestionnaire) n'existe nulle part non plus.