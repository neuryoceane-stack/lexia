# Catalogue — packs vocabulaire (langue italienne)

| # | Nom du pack | Contenu | Fichier .xlsx | Langue | Mots | Expressions | Prix |
|---|-------------|---------|---------------|--------|------|-------------|------|
| 1 | Environnement & climat | Écologie, énergie, météo extrême | `pack-01-environnement.xlsx` | italien | 80 | 20 | |
| 2 | Voyage & transports | Aéroport, train, réservation, douane | `pack-02-voyage-transports.xlsx` | italien | 80 | 20 | |
| 3 | Travail & carrière | Entretien, bureau, salaire, démission | `pack-03-travail-carriere.xlsx` | italien | 80 | 20 | |
| 4 | Médias & réseaux sociaux | Posts, infos, vidéos, fausses informations | `pack-04-medias-reseaux.xlsx` | italien | 80 | 20 | |
| 5 | Santé & corps | Symptômes, hôpital, pharmacie, forme | `pack-05-sante-corps.xlsx` | italien | 80 | 20 | |
| 6 | Société & débats | Droits, élections, opinions | `pack-06-societe-debats.xlsx` | italien | 80 | 20 | |
| 7 | Vie quotidienne | Maison, repas, courses, routines | `pack-07-vie-quotidienne.xlsx` | italien | 80 | 20 | |
| 8 | Études & école | Cours, examens, notes, révisions | `pack-08-etudes-ecole.xlsx` | italien | 80 | 20 | |
| 9 | Technologie & sciences | Numérique, labo, innovations | `pack-09-technologie-sciences.xlsx` | italien | 80 | 20 | |
| 10 | Culture & arts | Cinéma, musique, théâtre, peinture | `pack-10-culture-arts.xlsx` | italien | 80 | 20 | |
| 11 | Sport & loisirs | Matchs, entraînement, compétition | `pack-11-sport-loisirs.xlsx` | italien | 80 | 20 | |
| 12 | Nourriture & cuisine | Recettes, restaurant, ingrédients | `pack-12-nourriture-cuisine.xlsx` | italien | 80 | 20 | |
| 13 | Argent & économie | Banque, budget, prix, achats | `pack-13-argent-economie.xlsx` | italien | 80 | 20 | |
| 14 | Relations & émotions | Amitié, amour, famille, sentiments | `pack-14-relations-emotions.xlsx` | italien | 80 | 20 | |
| 15 | Nature & animaux | Faune, paysages, plantes | `pack-15-nature-animaux.xlsx` | italien | 80 | 20 | |
| 16 | Ville & orientation | Rues, directions, transports, quartiers | `pack-16-ville-orientation.xlsx` | italien | 80 | 20 | |

Chaque pack : 65 mots du thème, 15 verbes ou locutions verbales, 20 expressions. Les noms portent l'article défini (`il`, `lo`, `la`, `l'`, `i`, `gli`, `le`). Quand l'article est `l'`, le genre est noté `(m.)` ou `(f.)`. Les verbes pronominaux sont à l'infinitif en `-si`. Les définitions sont en français de France, à l'infinitif ; un tutoiement n'apparaît que si la consigne s'adresse à l'élève. Chaque expression est une locution figurée d'usage courant : le sens donné est le sens réel, pas le mot à mot.

Les faux amis fréquents pour un élève francophone sont signalés dans la définition (`la ricetta`, `i parenti`, `volare`, `salire`, `il burro`, `il bar`, `la libreria`, `il voto`, `il palazzo`, `mancare`).

Vérification : `node shop-packs/ita/check-duplicates.mjs` (aucun terme ni définition identique entre packs), puis `node shop-packs/ita/build-pack-NN.mjs` (100 lignes, 80 mots, 20 expressions).

## Visibilité

Ces packs restent invisibles tant qu'ils ne sont pas activés. Dans l'espace créateur, section Boutique : cochez les packs (ou « Tout sélectionner »), puis « Rendre visible ». Une confirmation précède la création des produits Stripe. Les packs sont traités l'un après l'autre par le PATCH existant. En cas d'échec, les autres continuent : le récapitulatif donne le nom du pack et la raison, et le pack en échec reste inactif.

Le prix n'est pas fixé ici : il se décide au moment de l'activation, comme pour l'anglais.
