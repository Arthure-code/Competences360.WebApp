# Notes techniques

## CSS Modules — conflits de spécificité sur les atomes de base (`Card`, etc.)

**Problème :** un atome de base (ex. `Card.module.css`) et un composant qui
l'utilise (ex. `ModuleCard.module.css`) déclarent tous les deux une règle sur
la même propriété (`display`, `padding`, `background-color`...) pour des
classes posées sur le même élément DOM. Les deux sélecteurs ont la même
spécificité (une seule classe = 0-1-0) → c'est l'ordre d'assemblage du build
(Next/Turbopack) qui décide qui gagne, pas l'intention du code. Résultat
imprévisible et parfois différent entre dev et prod.

**Solution :** dans l'atome de base, envelopper ses règles dans `:where()` :

```css
/* Avant */
.card {
    display: block;
    padding: var(--space-5);
}

/* Après */
:where(.card) {
    display: block;
}
:where(.padding-md) {
    padding: var(--space-5);
}
```

`:where()` ramène la spécificité de la règle à zéro. N'importe quelle classe
normale d'un composant qui utilise l'atome (`ModuleCard`, `ContinueLearningCard`,
une classe passée en `className`, etc.) l'emporte alors **toujours**, peu
importe l'ordre de build.

**À appliquer systématiquement** à tout atome de base pensé pour être
surchargé par ses consommateurs (`Card` déjà fait — vérifier `Button` et les
futurs atomes similaires si un style semble "ne pas s'appliquer" alors que le
code a l'air correct).

### Règle à suivre pour chaque nouvel atome

Si un atome expose un prop `className` destiné à composer avec ses propres
classes sur le **même élément racine**, ses règles de base doivent être
écrites en `:where(.xxx) { ... }` dès sa création — pas seulement corrigées
après coup.

Atomes déjà construits à vérifier/corriger : `ProgressBar`, `EmptyState`,
`StatBar`, `DismissibleBanner`, `SectionHeader`, `StatusBadge`, `Tabs`,
`PillGroup`, `Drawer`, `SearchInput`.

Pas concernés tant qu'ils n'exposent pas de `className` sur leur racine :
`Toggle`, `Checkbox`, `InlineNotice`.