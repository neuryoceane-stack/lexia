# Typographie – Kim Study

Chargement : `next/font` dans `src/app/layout.tsx`. Pas d’import Google Fonts dans la CSS.

| Usage | Police | Poids | Où |
|-------|--------|-------|----|
| Titres (`h1`, `h2`, `h3`, `.font-heading`) | Bricolage Grotesque | 700 | `--font-heading` |
| Texte, boutons, interface | DM Sans | 400 et 500 | `--font-sans` |

DM Sans n’est pas chargé en 600 ni en 700 : un `font-semibold` ou `font-bold` sur du texte DM Sans s’affiche en 500 (`font-synthesis: none` sur `body`). Les titres passent par Bricolage Grotesque, qui a le poids 700.

Les titres des pages de connexion, d’inscription et de mot de passe utilisent `.auth-step-title` (Bricolage Grotesque 700). Les champs et le bouton principal de ces écrans sont `.auth-field` (52 px, rayon 14, bordure `--line`, bordure `--ink` au focus) et `.auth-submit` (pilule, 56 px).
