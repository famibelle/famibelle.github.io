# CV — Medhi Famibelle

CV et vitrine de projets, page statique publiée sur <https://famibelle.github.io>.

## Aperçu local

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Export PDF

Ouvrir la page dans un navigateur, `Ctrl+P`, « Enregistrer au format PDF ».
La mise en page d'impression est définie dans `assets/print.css` (A4).

## Déploiement

GitHub Pages, depuis la racine de la branche par défaut.
Le dépôt doit s'appeler `famibelle.github.io` pour être servi à la racine du domaine.
Le fichier `.nojekyll` désactive le pré-traitement Jekyll.
