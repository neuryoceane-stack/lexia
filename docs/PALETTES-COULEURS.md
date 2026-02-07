# Palettes de couleurs – Lexia

Référence des palettes utilisables dans le projet. La **Palette 1** est celle appliquée par défaut dans l’interface.

---

## Palette 1 – Bleu pédagogique + jaune *(recommandée)*

| Nom            | Hex       | Usage                          |
|----------------|-----------|--------------------------------|
| Bleu principal | `#3B6EEA` | Liens, boutons principaux, focus |
| Bleu clair     | `#6FA8FF` | Hover, variante claire         |
| Bleu foncé     | `#1F3FB7` | Hover boutons, texte sur fond clair |
| Jaune accent   | `#FFC83D` | CTA / promo (ex. « Créer une famille ») |
| Blanc          | `#FFFFFF` | Fonds, texte sur fond coloré   |
| Gris texte     | `#2F2F2F` | Texte principal                |

**Classes Tailwind (thème actuel)** : `primary`, `primary-light`, `primary-dark`, `accent`, `vocab-white`, `vocab-gray`

---

## Palette 2 – Vert apprentissage + crème

| Nom          | Hex       | Usage              |
|--------------|-----------|--------------------|
| Vert principal | `#2FBF71` | Couleur principale |
| Vert foncé   | `#1F8A55` | Hover, renforcement |
| Vert clair   | `#6EE7B7` | Fonds légers       |
| Crème (fond) | `#FFF7E6` | Fond de page       |
| Noir doux    | `#2A2A2A` | Texte              |

**Classes optionnelles** : `p2-primary`, `p2-cream`

---

## Palette 3 – Violet tech + turquoise

| Nom                    | Hex       | Usage              |
|------------------------|-----------|--------------------|
| Violet principal       | `#6C4DFF` | Couleur principale |
| Violet foncé          | `#4B32CC` | Hover              |
| Turquoise             | `#3ACFD5` | Accent             |
| Bleu clair complémentaire | `#8EE3F5` | Complément         |
| Blanc                 | `#FFFFFF` | Fonds              |

**Classes optionnelles** : `p3-primary`, `p3-turquoise`

---

## Palette 4 – Noir mat + accent fluo

| Nom           | Hex       | Usage              |
|---------------|-----------|--------------------|
| Noir          | `#111111` | Fond, texte         |
| Gris foncé    | `#1E1E1E` | Surfaces           |
| Blanc         | `#FFFFFF` | Texte sur fond sombre |
| Vert fluo     | `#3DFF8E` | Accent / succès    |
| Orange fluo   | `#FF8A00` | Alternative accent |

**Classes optionnelles** : `p4-green-fluo`, `p4-orange-fluo`

---

## Où c’est défini dans le projet

- **Variables CSS et thème Tailwind** : `src/app/globals.css`  
  - `:root` : variables brutes (--p1-*, --p2-*, etc.)  
  - `@theme inline` : couleurs du thème (primary, accent, vocab-gray, etc.)
- **Ce fichier** : `docs/PALETTES-COULEURS.md` (référence uniquement).

Pour changer de palette par défaut, adapter les valeurs dans `@theme` dans `globals.css` en s’appuyant sur les hex de ce document.
