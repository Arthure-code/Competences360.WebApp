# Types d'exercices — fonctionnement

Document de référence pour `types/exercice.ts` et le futur `ExercisePlayer`.
À tenir à jour si un type change ou si un type est ajouté.

## Principes de conception

- **Un type = une interface** dans l'union `Exercise`. Ajouter un type
  d'exercice = ajouter une interface + une entrée dans l'union, sans
  toucher aux types existants.
- **Le média est transversal, pas un type d'exercice.** Image/vidéo/audio
  peuvent être attachés à n'importe quelle question et/ou à chaque option
  individuellement, via `MediaAttachment`. Un QCM normal et un QCM à choix
  illustrés sont la même interface — `media` est juste rempli ou non.
- **Les options répétées sont mutualisées.** QCM, Ordre et Association
  utilisent tous `LabeledOption` (`{ id, label, media? }`) plutôt que de
  redéfinir `{id, label}` dans chaque interface.
- **Le drag-and-drop est toujours un bonus, jamais l'unique moyen
  d'interaction.** Ordre a ses boutons flèche haut/bas, Association a son
  tap-tap (sélectionner une option puis taper la cible) — le glisser-
  déposer (dnd-kit) s'ajoute par-dessus pour qui est à l'aise avec, mais
  rien n'est fonctionnellement bloqué sans lui. Voir "Infrastructure de
  drag-and-drop partagée" plus bas.

## Média (`MediaAttachment`)

```ts
interface MediaAttachment {
    type: "image" | "video" | "audio"
    url: string
    alt?: string      // requis en pratique pour une image (accessibilité, synthèse vocale)
    caption?: string
}
```

Deux points d'attache possibles :
- `ExerciseBase.media` — illustration/support de la question (ex. une image à regarder avant de répondre).
- `LabeledOption.media` — chaque choix individuel peut être une image plutôt qu'un texte.

## Les 8 types d'exercices

### 1. Choix de réponse (`qcm`)
Une question, plusieurs choix, une seule bonne réponse.
```ts
config: {
    choices: LabeledOption[]
    correctChoiceId: string
}
```

### 2. Vrai ou faux (`vrai_faux`)
```ts
config: {
    correctAnswer: boolean
}
```

### 3. Réponse courte (`reponse_courte`)
Une phrase à trous, un ou plusieurs. La phrase est une séquence de
segments — texte fixe ou trou à remplir — plutôt qu'un seul champ, pour
supporter nativement plusieurs trous dans la même phrase.
```ts
type ReponseCourteSegment =
    | { type: "text"; content: string }
    | { type: "blank"; id: string; acceptedAnswers: string[] }

config: {
    segments: ReponseCourteSegment[]
}
```
*Exemple : "Bonjour ___, je vous écris au sujet de ___." → 4 segments (texte, trou, texte, trou).*

### 4. Question numérique (`question_numerique`)
Réponse chiffrée avec marge de tolérance — distinct de "réponse courte"
car la comparaison est numérique, pas une correspondance de texte.
```ts
config: {
    correctValue: number
    tolerance: number   // marge acceptée de part et d'autre, ex. 0.5
    unit?: string        // suffixe affiché, ex. "$", "%", "min"
}
```

**Comportement de saisie.** Le champ accepte les formats FR courants :
virgule comme séparateur décimal, espace comme séparateur de milliers
(ex. "1 234,56"). Une saisie ambiguë (ex. deux virgules) est rejetée
plutôt que mal interprétée — la validation refuse plutôt que de deviner.
Un pavé +/- permet d'ajuster sans clavier ; son incrément est calé sur
`tolerance`, avec un plancher à 0,1 pour rester utilisable même sur une
tolérance très fine. La valeur soumise est arrondie à l'affichage selon le
nombre de décimales de `tolerance`, pour éviter un artefact de précision
flottante (ex. `0.30000000000000004`).

Il n'y a pas de bornes min/max dans le schéma actuel — rien n'empêche une
réponse hors d'une plage "raisonnable" pour la question. À ajouter au
schéma si un exercice en a besoin.

### 5. Zone cliquable (`zone_cliquable`)
Une image, une ou plusieurs zones cliquables dessus (hotspots), une seule
bonne zone. Pas de simulation de document structuré (texte) — l'image est
le seul support, ce qui est à la fois plus simple à comprendre pour un
formateur qui crée du contenu et plus simple à afficher de façon fiable
peu importe le type de document (courriel, fiche de paie, formulaire...).

Coordonnées en **pourcentage de l'image** (0-100), pas en pixels, pour
rester correct peu importe la taille d'affichage.
```ts
config: {
    image: MediaAttachment
    zones: { id: string; x: number; y: number; width: number; height: number; isCorrect: boolean }[]
}
```

**Interaction.** Le tap sélectionne une zone sans corriger — il faut
appuyer sur "Valider ma réponse" pour déclencher la correction, comme
QCM/Vrai-Faux (voir "Logique de réussite"). Les zones ont un contour
pointillé discret dès le départ (affordance visible dès l'affichage,
jamais un élément cliquable invisible), et un anneau de focus visible au
clavier (`:focus-visible`, pas au tap tactile).

**Taille tactile.** `width`/`height` étant en `%`, une petite zone sur une
image compacte peut descendre sous les 44px recommandés. Un plancher CSS
(`min-width`/`min-height: 44px`) fait grandir la cible tapable au besoin —
un filet de sécurité en aval ; le vrai correctif est en amont, à l'outil
de création (voir plus bas).

**Chevauchement des zones — à valider à la création, pas à l'affichage.**
L'outil de création de zones n'existe pas encore. Le renderer affiche des
zones déjà définies sans vérifier qu'elles se chevauchent — ce n'est pas
son rôle. L'utilitaire `zonesOverlap`/`findOverlappingZones`
(`zoneOverlap.ts`) est prêt à être branché dans cet outil dès qu'il sera
construit, pour bloquer ou avertir dès le placement d'une zone plutôt que
de découvrir le problème une fois l'exercice publié.

### 6. Glisser-déposer — ordre (`ordre`)
Remettre des éléments dans le bon ordre. Pas de "banque" séparée — les
éléments à réordonner sont directement la liste à manipuler.
```ts
config: {
    items: LabeledOption[]
    correctOrder: string[]   // ids de `items`, dans l'ordre attendu
}
```

**Interaction.** Moyen principal, toujours visible : deux boutons flèche
haut/bas. Le drag (dnd-kit,
`useSortable`) est un bonus déclenché uniquement depuis une poignée
dédiée — le reste de la ligne reste cliquable sans risque de drag
accidentel. Pendant le drag, un `DragOverlay` fait suivre au curseur un
aperçu opaque, et les autres items se décalent en douceur pour révéler la
véritable position d'insertion (pas juste un "trou" statique). Navigation
clavier possible une fois la poignée en focus (flèches), en plus des
boutons.

### 7. Glisser-déposer — association (`association`)
Glisser des options depuis une banque vers des emplacements cibles.
```ts
config: {
    targets: LabeledOption[]        // colonne de gauche, fixe
    options: LabeledOption[]        // banque à glisser
    correctMap: Record<string, string>  // targetId -> optionId correct
}
```

**Interaction.** Deux colonnes : cibles fixes (gauche) + banque d'options
(droite, ou en dessous sur mobile). Le tap-tap est le moyen principal et
fiable au tactile : sélectionner une option dans la banque, puis taper la
cible visée pour l'y placer — une option déjà placée se retire d'un tap
sur sa case. Le drag (dnd-kit, `useDraggable`/`useDroppable` — pas
`useSortable`, car il n'y a pas de tri d'une liste sur elle-même mais un
déplacement entre deux zones distinctes) est un bonus : chaque cible se
surligne pendant qu'une option est glissée au-dessus (feedback avant même
le drop), et un `DragOverlay` fait suivre un aperçu opaque au curseur.

### 8. Vidéo interactive (`video_interactive`)
Un graphe de segments vidéo. Chaque segment (`VideoNode`) peut avoir des
points de décision — un moment où la vidéo se met en pause et affiche des
choix, chaque choix menant à un autre segment. Un segment sans point de
décision est une fin de parcours.
```ts
config: {
    nodes: {
        id: string
        video: MediaAttachment
        decisionPoints: {
            timestampSeconds: number
            choices: { id: string; label: string; nextNodeId: string }[]
        }[]
    }[]
    startNodeId: string
}
```

## Infrastructure de drag-and-drop partagée (dnd-kit)

Ordre et Association utilisent tous deux dnd-kit, mais avec des modèles
d'interaction différents (`useSortable` pour Ordre, `useDraggable`/
`useDroppable` pour Association) — ces composants d'item ne sont donc pas
mutualisés. Ce qui est commun entre les deux, et prévu pour être repris
par une future mécanique basée sur dnd-kit, vit dans un dossier partagé
`dnd/` :

- **`useExerciseDndSensors`** — centralise le seuil d'activation du drag
  (distance en px avant que le geste ne soit considéré comme un drag
  plutôt qu'un tap/clic), pour que ce compromis tap-vs-drag ne diverge pas
  silencieusement d'une mécanique à l'autre. Prend une option
  `sortableKeyboard` pour activer la navigation clavier uniquement là où
  elle a un sens (une liste triable comme Ordre ; pas Association, qui n'a
  pas d'ordre linéaire).
- **`ResultIcon`** — icône de résultat (check/xmark) une fois corrigé.
  Découplée volontairement du vocabulaire d'état de chaque mécanique
  (Association a un état `"filled"` qu'Ordre n'a pas) : elle ne prend
  qu'un `isCorrect: boolean | null`, pas l'état complet.
- **`dnd-shared.module.css`** — apparence du drag elle-même (`.dragOrigin`
  pour l'emplacement d'origine pendant le drag, `.dragOverlay` pour
  l'aperçu qui suit le curseur), commune aux deux mécaniques. Les couleurs
  propres à chaque état de correction restent dans le `.module.css` de
  chaque mécanique.
- **`types.ts`** (`BaseAnswerState`) — vocabulaire d'état de base
  (`"default" | "correct" | "incorrect"`) que chaque mécanique étend selon
  ses besoins, plutôt que deux types isolés qui pourraient diverger sans
  qu'on s'en aperçoive.

Principe de découpage : ce qui est **un choix de design system ou une
règle technique globale** (apparence du drag, seuil d'activation, icône de
résultat) va dans `dnd/`. Ce qui est **un choix propre à la mécanique**
(comment les données bougent, quelle interaction fait quoi) reste dans le
renderer de la mécanique, même si le code se ressemble en surface.

## Navigation entre exercices

- L'apprenant peut naviguer librement entre les exercices **non encore
  soumis** d'un niveau, dans n'importe quel ordre (peut aussi choisir de
  passer une question et d'y revenir plus tard).
- Plusieurs tentatives sont permises sur un exercice **tant qu'il n'a pas
  de résultat final**.
- Une fois qu'un exercice a un résultat final (bon ou mauvais), il n'est
  plus modifiable — l'apprenant ne peut plus revenir dessus pour le refaire,
  mais peut consulter sa correction (voir "Correction et feedback").
- Navigation par **numéros cliquables** (1, 2, 3, 4, 5...) plutôt que
  suivant/précédent seul — nécessaire pour permettre de sauter directement
  à un exercice non séquentiel. Chaque numéro encode aussi l'état de
  l'exercice (à faire / réussi / échoué / passé), pas juste sa position.
  "Exercice suivant" reste disponible comme action principale après une
  réponse, pour le flux linéaire normal.

## Logique de réussite (score)

| Situation | Résultat |
|---|---|
| Réussi du premier essai | 1 point → passe à l'exercice suivant |
| 1er échec | Encouragement, peut réessayer → si réussi : 1 point **ou** voir la réponse (0,25 point) |
| 2e échec | Voir la réponse automatiquement (0,25 point) |

## Correction et feedback

**Panneau persistant** (bottom sheet sur mobile, panneau ancré sur
desktop) — pas un popup/modal plein écran. Reste dans le DOM une fois
ouvert : peut être réduit puis rouvert sans perdre son contenu ni son
état, contrairement à un modal qui se détruit à la fermeture. Ne recouvre
pas l'exercice — permet d'afficher la correction *en contexte* (ex. bonne
zone en vert / mauvaise en rouge directement sur l'image pour une zone
cliquable) en plus du texte.

Un exercice déjà complété reste accessible via la navigation par numéros
(voir "Navigation entre exercices") — cliquer dessus rouvre son panneau de
correction en mode lecture, sans bouton dédié séparé pour "rouvrir".

**Obligation de contenu à la création (`hint` / `explanation`).** Les deux
champs sont optionnels dans le schéma (`ExerciseBase`), mais pas au même
degré du point de vue de l'outil de création :

- **`explanation` — obligatoire.** Il s'affiche à chaque fin de parcours
  (réussite, révélation au 2e échec automatique, ou "Voir la réponse"
  volontaire). Comme la révélation au 2e échec est automatique (voir
  `submitAnswer`), un apprenant qui échoue se retrouve avec seulement la
  bonne réponse et aucun contexte pédagogique si le champ est vide — c'est
  justement le moment où l'explication a le plus de valeur. L'outil de
  création doit bloquer la publication d'un exercice sans `explanation`.
- **`hint` — optionnel, mais avec un rappel visuel.** Certains exercices
  n'ont pas besoin d'indice pour être compris (ex. un `vrai_faux` à énoncé
  direct), et forcer le champ produit souvent un remplissage creux ("Réfléchissez
  bien !") qui n'aide personne. Le renderer gère déjà proprement son
  absence (`!isFinal && exercise.hint` — rien ne s'affiche). L'outil de
  création doit plutôt afficher un avertissement non bloquant ("Cet
  exercice n'a pas d'indice — les apprenants n'auront pas d'aide en cas
  d'erreur") sans empêcher la sauvegarde.

Champs affichés (chaque rétroaction n'affiche que ceux qui sont pertinents
pour la situation) :

- Titre (ex. "Pas tout à fait", "Bonne réponse !", "Pas encore, mais c'est normal.")
- Sous-titre
- Réponse de l'usager
- Bonne réponse
- Explication
- Indice
- Message d'encouragement
- Bouton "Exercice suivant"
- Bouton "Réessayer"
- Info de position (ex. "Exercice 2 sur 5")
- Bouton fermer
- Bouton audio (lecture à voix haute — contenu exact à décider)