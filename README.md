# Dashboard Orkestra

Vue mobile publique et strictement en lecture seule des données de pilotage versionnées dans `jeanc0071/projet`.

## Source actuelle

- dépôt : `jeanc0071/projet`
- branche : `agent/refresh-stability`
- dossier : `.project-control`
- fichiers consommés : `current-status.json`, `tasks.json`, `validations.json`

## Publication GitHub Pages

Dans les paramètres du dépôt, ouvrir **Pages**, choisir **Deploy from a branch**, puis sélectionner **main** et **/(root)**.

Adresse attendue : `https://jeanc0071.github.io/Dashboard-orchestra/`

## Limites

Le dashboard ne voit que les informations poussées sur GitHub. Il ne lit pas le serveur local, la base SQLite locale ni les modifications non versionnées. Aucun bouton ne modifie les dépôts sources.
