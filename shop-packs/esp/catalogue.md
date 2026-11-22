# Catalogue — packs vocabulaire (langue espagnole)

Série de 16 packs, mêmes thèmes et même ordre que l'anglais. Ce fichier décrit le lot 1 (packs 1 à 4). Les lots suivants complètent le tableau après relecture.

| # | Nom du pack | Contenu | Fichier .xlsx | Langue | Mots | Expressions | Prix |
|---|-------------|---------|---------------|--------|------|-------------|------|
| 1 | Environnement & climat | Écologie, énergie, météo extrême | `pack-01-environnement.xlsx` | espagnol | 80 | 20 | |
| 2 | Voyage & transports | Aéroport, train, réservation, douane | `pack-02-voyage-transports.xlsx` | espagnol | 80 | 20 | |
| 3 | Travail & carrière | Entretien, bureau, salaire, démission | `pack-03-travail-carriere.xlsx` | espagnol | 80 | 20 | |
| 4 | Médias & réseaux sociaux | Posts, infos, vidéos, fausses informations | `pack-04-medias-reseaux.xlsx` | espagnol | 80 | 20 | |

Chaque pack : 65 mots du thème, 15 verbes ou locutions verbales, 20 expressions. Les noms portent l'article (`el`, `la`, `los`, `las`) quand le genre se lit ainsi. Les verbes pronominaux portent `se`. Les définitions sont en français de France, à l'infinitif. Un faux ami classique est signalé dans la définition (`et non « … »`). Chaque expression est une locution figurée d'usage courant : le sens donné est le sens réel, pas le mot à mot. L'espagnol est celui d'Espagne, tel qu'il s'enseigne au collège et au lycée.

Vérification : `node shop-packs/esp/check-duplicates.mjs` (aucun terme ni définition identique entre packs), puis `node shop-packs/esp/build-pack-NN.mjs` (100 lignes, 80 mots, 20 expressions).

## Visibilité

Ces packs restent invisibles tant qu'ils ne sont pas activés. Dans l'espace créateur, section Boutique : cochez les packs (ou « Tout sélectionner »), puis « Rendre visible ». Une confirmation précède la création des produits Stripe. Les packs sont traités l'un après l'autre par le PATCH existant. En cas d'échec, les autres continuent : le récapitulatif donne le nom du pack et la raison, et le pack en échec reste inactif.

Le prix n'est pas fixé ici : il se décide au moment de l'activation, comme pour l'anglais.
