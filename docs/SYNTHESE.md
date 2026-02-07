# Synthèse – Vocab Jardin

Vue d’ensemble de la progression et statistiques d’apprentissage.

## Fonctionnalités

- **Sélecteur de période** : Jour, Semaine, Mois, Année, Tout (depuis le début).
- **Dashboard** : identique quelle que soit la période ; affichage du temps total, des mots mémorisés et des mots écrits sur la période.
- **Vue calendaire** : grille type “apps sport” (heatmap) selon la période (jour = 1 cellule, semaine = 7, mois = ~30, année = 12 mois, tout = derniers jours).
- **Filtre par langue** : langues issues des sessions, sélection multiple ; les statistiques se mettent à jour en temps réel.
- **Avatar évolutif** : 5 états (inactif → suprême), 3 types (arbre, phénix, koala). Calcul basé sur le temps passé et la régularité (jours avec activité). Type configurable dans Paramètres.

## API

- **GET /api/synthese**  
  Query : `period=day|week|month|year|all`, `languages=eng,fra` (optionnel).  
  Réponse : `totalDurationSeconds`, `wordsRetained`, `wordsWritten`, `languagesAvailable`, `sessionsByDay`, `avatarState` (1–5).

- **GET /api/user/preferences**  
  Réponse : `avatarType` (arbre | phenix | koala).

- **PATCH /api/user/preferences**  
  Body : `{ "avatarType": "arbre" | "phenix" | "koala" }`.

## Données

- **revision_sessions** : `language` (optionnel) enregistré à la fin de chaque session (langue des listes révisées).
- **user_preferences** : `avatarType` pour l’avatar affiché dans la Synthèse.

## Fichiers principaux

- `src/app/(app)/app/jardin/page.tsx` + `jardin-client.tsx` : page Synthèse.
- `src/app/(app)/app/parametres/` : choix du type d’avatar.
- `src/app/api/synthese/route.ts` : agrégation des sessions et calcul de l’état avatar.
- `src/components/synthese-avatar.tsx` : rendu des 3 types d’avatar selon l’état (1–5).
