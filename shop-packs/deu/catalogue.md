# Catalogue — packs vocabulaire (langue allemande)

| # | Nom du pack | Contenu | Fichier .xlsx | Langue | Mots | Expressions | Prix |
|---|-------------|---------|---------------|--------|------|-------------|------|
| 1 | Environnement & climat | Écologie, énergie, météo extrême | `pack-01-environnement.xlsx` | allemand | 80 | 20 | |
| 2 | Voyage & transports | Aéroport, train, réservation, douane | `pack-02-voyage-transports.xlsx` | allemand | 80 | 20 | |
| 3 | Travail & carrière | Entretien, bureau, salaire, démission | `pack-03-travail-carriere.xlsx` | allemand | 80 | 20 | |
| 4 | Médias & réseaux sociaux | Posts, infos, vidéos, fausses informations | `pack-04-medias-reseaux.xlsx` | allemand | 80 | 20 | |
| 5 | Santé & corps | Symptômes, hôpital, pharmacie, forme | `pack-05-sante-corps.xlsx` | allemand | 80 | 20 | |
| 6 | Société & débats | Droits, élections, opinions | `pack-06-societe-debats.xlsx` | allemand | 80 | 20 | |
| 7 | Vie quotidienne | Maison, repas, courses, routines | `pack-07-vie-quotidienne.xlsx` | allemand | 80 | 20 | |
| 8 | Études & école | Cours, examens, notes, révisions | `pack-08-etudes-ecole.xlsx` | allemand | 80 | 20 | |
| 9 | Technologie & sciences | Numérique, labo, innovations | `pack-09-technologie-sciences.xlsx` | allemand | 80 | 20 | |
| 10 | Culture & arts | Cinéma, musique, théâtre, peinture | `pack-10-culture-arts.xlsx` | allemand | 80 | 20 | |
| 11 | Sport & loisirs | Matchs, entraînement, compétition | `pack-11-sport-loisirs.xlsx` | allemand | 80 | 20 | |
| 12 | Nourriture & cuisine | Recettes, restaurant, ingrédients | `pack-12-nourriture-cuisine.xlsx` | allemand | 80 | 20 | |
| 13 | Argent & économie | Banque, budget, prix, achats | `pack-13-argent-economie.xlsx` | allemand | 80 | 20 | |
| 14 | Relations & émotions | Amitié, amour, famille, sentiments | `pack-14-relations-emotions.xlsx` | allemand | 80 | 20 | |
| 15 | Nature & animaux | Faune, paysages, plantes | `pack-15-nature-animaux.xlsx` | allemand | 80 | 20 | |
| 16 | Ville & orientation | Rues, directions, transports, quartiers | `pack-16-ville-orientation.xlsx` | allemand | 80 | 20 | |

Chaque pack : 65 mots du thème, 15 verbes à particule séparable, 20 expressions. Les noms portent l'article (`der`, `die`, `das`). Les verbes pronominaux portent `sich`. Les définitions sont en français, à l'infinitif. Chaque expression est une locution figurée d'usage courant : le sens donné est le sens réel, pas le mot à mot.

Vérification : `node shop-packs/deu/check-duplicates.mjs` (aucun terme ni définition identique entre packs), puis `node shop-packs/deu/build-pack-NN.mjs` (100 lignes, 80 mots, 20 expressions).

## Visibilité

Ces packs restent invisibles tant qu'ils ne sont pas activés. Dans l'espace créateur, section Boutique : cochez les packs (ou « Tout sélectionner »), puis « Rendre visible ». Une confirmation précède la création des produits Stripe. Les packs sont traités l'un après l'autre par le PATCH existant. En cas d'échec, les autres continuent : le récapitulatif donne le nom du pack et la raison, et le pack en échec reste inactif.

Le prix n'est pas fixé ici : il se décide au moment de l'activation, comme pour l'anglais.
