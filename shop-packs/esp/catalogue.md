# Catalogue — packs vocabulaire (langue espagnole)

Série de 16 packs, mêmes thèmes et même ordre que l'anglais. Les 16 packs sont livrés.

| # | Nom du pack | Contenu | Fichier .xlsx | Langue | Mots | Expressions | Prix |
|---|-------------|---------|---------------|--------|------|-------------|------|
| 1 | Environnement & climat | Écologie, énergie, météo extrême | `pack-01-environnement.xlsx` | espagnol | 80 | 20 | |
| 2 | Voyage & transports | Aéroport, train, réservation, douane | `pack-02-voyage-transports.xlsx` | espagnol | 80 | 20 | |
| 3 | Travail & carrière | Entretien, bureau, salaire, démission | `pack-03-travail-carriere.xlsx` | espagnol | 80 | 20 | |
| 4 | Médias & réseaux sociaux | Posts, infos, vidéos, fausses informations | `pack-04-medias-reseaux.xlsx` | espagnol | 80 | 20 | |
| 5 | Santé & corps | Symptômes, hôpital, pharmacie, forme | `pack-05-sante-corps.xlsx` | espagnol | 80 | 20 | |
| 6 | Société & débats | Droits, élections, opinions | `pack-06-societe-debats.xlsx` | espagnol | 80 | 20 | |
| 7 | Vie quotidienne | Maison, repas, courses, routines | `pack-07-vie-quotidienne.xlsx` | espagnol | 80 | 20 | |
| 8 | Études & école | Cours, examens, notes, révisions | `pack-08-etudes-ecole.xlsx` | espagnol | 80 | 20 | |
| 9 | Technologie & sciences | Informatique, laboratoire, données | `pack-09-technologie-sciences.xlsx` | espagnol | 80 | 20 | |
| 10 | Culture & arts | Cinéma, musique, musée, littérature | `pack-10-culture-arts.xlsx` | espagnol | 80 | 20 | |
| 11 | Sport & loisirs | Match, entraînement, classement | `pack-11-sport-loisirs.xlsx` | espagnol | 80 | 20 | |
| 12 | Nourriture & cuisine | Ingrédients, restaurant, recettes | `pack-12-nourriture-cuisine.xlsx` | espagnol | 80 | 20 | |
| 13 | Argent & économie | Banque, prix, impôts, budget | `pack-13-argent-economie.xlsx` | espagnol | 80 | 20 | |
| 14 | Relations & émotions | Famille, sentiments, couple | `pack-14-relations-emotions.xlsx` | espagnol | 80 | 20 | |
| 15 | Nature & animaux | Paysages, faune, flore | `pack-15-nature-animaux.xlsx` | espagnol | 80 | 20 | |
| 16 | Ville & orientation | Rues, directions, repères | `pack-16-ville-orientation.xlsx` | espagnol | 80 | 20 | |

Chaque pack : 65 mots du thème, 15 verbes ou locutions verbales, 20 expressions. Les noms portent l'article (`el`, `la`, `los`, `las`) quand le genre se lit ainsi. Les verbes pronominaux portent `se`. Les définitions sont en français de France, à l'infinitif. Un faux ami pour un francophone est signalé dans la définition (`et non « … »`). On ne signale pas un piège qui n'existe qu'en anglais. Chaque expression est une locution figurée d'usage courant : le sens donné est le sens réel, pas le mot à mot. L'espagnol est celui d'Espagne, tel qu'il s'enseigne au collège et au lycée.

Vérification : `node shop-packs/esp/check-duplicates.mjs` (aucun terme ni définition identique entre packs), puis `node shop-packs/esp/build-pack-NN.mjs` (100 lignes, 80 mots, 20 expressions).

## Visibilité

Ces packs restent invisibles tant qu'ils ne sont pas activés. Dans l'espace créateur, section Boutique : cochez les packs (ou « Tout sélectionner »), puis « Rendre visible ». Une confirmation précède la création des produits Stripe. Les packs sont traités l'un après l'autre par le PATCH existant. En cas d'échec, les autres continuent : le récapitulatif donne le nom du pack et la raison, et le pack en échec reste inactif.

Le prix n'est pas fixé ici : il se décide au moment de l'activation, comme pour l'anglais.
