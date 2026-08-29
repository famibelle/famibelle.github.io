# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Objet du dépôt

CV personnel de Medhi Famibelle (AI Product/Architect & Strategy Manager), publié
comme page statique sur GitHub Pages. Sert aussi de vitrine : une section projets
renvoie vers les dépôts personnels. Le contenu est rédigé **en anglais** ; les
commentaires du code et la documentation sont en français.

Source du contenu : un CV PDF fourni hors dépôt. Le HTML en est la seule copie
versionnée — il n'est régénéré depuis rien.

## Commandes

Il n'y a ni build, ni dépendances, ni tests, ni linter : les fichiers sont servis tels quels.

```sh
python3 -m http.server 8000     # aperçu local sur http://localhost:8000
```

Export PDF : ouvrir la page, `Ctrl+P`, « Enregistrer au format PDF ». Pour contrôler
le rendu imprimé sans imprimer, utiliser l'émulation `print` des DevTools
(Chrome : *Rendering* → *Emulate CSS media type: print*).

## Architecture

Une seule page, trois fichiers :

- `index.html` — **le contenu et la structure vivent ici**. Il n'y a pas de couche
  de données séparée (pas de YAML, pas de JSON) : modifier le CV, c'est éditer ce HTML.
- `assets/style.css` — rendu écran uniquement.
- `assets/print.css` — chargé via `media="print"`, donc jamais actif à l'écran.
  Contient la mise en page A4 et les règles de pagination.

`.nojekyll` désactive le pré-traitement Jekyll de GitHub Pages ; sans lui, Pages
ignorerait les fichiers et dossiers commençant par `_`.

## Conventions du balisage

Le CSS est écrit contre une structure précise. S'en écarter casse la mise en page
silencieusement.

- **Chaque rubrique est une `<section id="…">` avec un `<h2>`.** Les ancres
  (`#experience`, `#skills`, …) sont stables ; ne pas les renommer sans raison.
- **Un poste est un `article.entry`** contenant un `header.entry-head` avec, dans
  cet ordre, `.entry-role`, `.entry-org`, `.entry-dates`. Le CSS place les dates
  en colonne de droite via une grille à deux colonnes, puis repasse sur une seule
  colonne sous 34rem. Un élément inséré hors de cette structure casse l'alignement.
- **Les missions client sont imbriquées dans le poste qui les porte** : un
  `div.missions` (filet vertical à gauche) contenant un `h4.missions-label` puis des
  `article.entry.entry--sub`. C'est le cas du poste AKABI, qui regroupe six missions.
- **`.note`** sert aux prix et références publiques d'une mission ; **`.stack`** à la
  liste des technologies, toujours en dernier dans l'entrée.
- **Les projets n'utilisent pas `.entry`** mais `ul.projects` > `li.project`, en cartes
  sur deux colonnes (une seule sous 34rem), avec `.project-name`, `.project-tag`,
  `.project-desc` et l'optionnel `.project-links`. La sélection est ordonnée par
  volume de commits réels de l'auteur, bots exclus (`git shortlog -sn --all`).
  Le titre pointe vers le **site GitHub Pages** du projet quand il en existe un qui
  répond (`gh api repos/famibelle/<repo>/pages` puis vérifier en 200 : `horoscope-ia`
  a Pages activé mais en `errored`), et retombe sur le dépôt GitHub sinon.
- **Les dates vont dans `<time datetime="AAAA-MM">`.**
- **Compétences et langues utilisent `dl.skills`** (paires `dt`/`dd`), pas des listes.
- **Toutes les couleurs passent par les variables de `:root`**, redéfinies pour le
  thème sombre. Une couleur écrite en dur ne suivra ni le thème sombre ni l'impression.

## Pièges connus

- **Pagination à l'impression.** `print.css` applique `break-inside: avoid` à
  `.entry` pour ne pas couper une expérience entre deux pages A4. Le poste AKABI
  dépasse à lui seul une page : la règle `.entry:has(.missions) { break-inside: auto }`
  le ré-autorise à se couper, sinon le navigateur produit une page blanche. Tout
  nouveau poste contenant des missions hérite automatiquement de cette exception ;
  tout autre bloc long ajouté hors `.entry` devra recevoir son propre traitement.
- **Le thème sombre a trois portes d'entrée, à tenir synchronisées.** La palette
  sombre est déclarée deux fois dans `style.css` — sous
  `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` pour la
  préférence système, et sous `:root[data-theme="dark"]` pour le choix explicite du
  sélecteur. `print.css` la neutralise une troisième fois pour revenir au noir sur
  blanc. **Ajouter une variable de couleur, c'est l'ajouter dans les trois blocs.**
  Le `:not([data-theme="light"])` n'est pas décoratif : sans lui, un utilisateur en
  système sombre ne pourrait pas forcer le thème clair. Et les sélecteurs de
  `print.css` recopient la spécificité des blocs sombres, sinon ils ne l'emportent pas.
- **Le sélecteur de thème vit dans `index.html`, pas dans un fichier JS.** Deux petits
  scripts inline : celui du `<head>` applique `data-theme` depuis `localStorage`
  **avant le premier rendu** (le déplacer en fin de page ferait clignoter la page en
  clair au chargement) ; celui de fin de document gère le clic, l'écriture dans
  `localStorage` et le libellé accessible. Sans choix enregistré, la page suit le
  système et le bouton se resynchronise sur l'évènement `change` du `matchMedia`.
- **Toute nouvelle rubrique doit être vérifiée en mode `print`,** pas seulement à
  l'écran, et dans les deux thèmes.

## Points ouverts

- Plus aucun `TODO` dans `index.html`. L'adresse email a été volontairement retirée
  de l'entête : le contact passe par LinkedIn et GitHub.
- Les dates du PDF source ont été corrigées par l'auteur et font foi :
  AKABI `10/2022 – 10/2025` (le PDF disait 10/2026) et BGL BNP Paribas
  début `10/2025` (le PDF disait 11/2026). Ne pas les « rectifier » depuis le PDF.

## Déploiement

Cible : le **site utilisateur** `famibelle.github.io`, servi à la racine du domaine.
Cela impose que le dépôt GitHub s'appelle exactement `famibelle.github.io`, quel que
soit le nom du dossier local. GitHub Pages sert la racine de la branche par défaut ;
il n'y a pas de workflow GitHub Actions, un `git push` suffit.

État actuel : **aucun remote git n'est configuré.** Avant le premier déploiement,
créer le dépôt, ajouter le remote, pousser, puis activer Pages dans
*Settings → Pages* (source : branche, dossier `/`).
